import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common'
import { OpenAI } from 'openai'
import { PrismaService } from 'src/modules/prisma/prisma.service'
import { Engines, Thread, User, Workspace } from '@prisma/client'
import Handlebars from 'handlebars'
import { createWriteStream, readFileSync } from 'fs'
import { RunQueryDto } from 'src/dto/run-query.dto'
import { QueryHelpDto } from 'src/dto/query-help.dto'
import * as path from 'node:path'
import { encode } from 'gpt-3-encoder'
import { format, isThisWeek } from 'date-fns'
import { CreateDataSourceDto } from 'src/dto/create-data-source.dto'
import { AddSchemaDataSourceDto } from 'src/dto/add-schema-data-source.dto'
import { FillTablesSchemaDto } from 'src/dto/fill-tables-schema.dto'
import { UpdateDataSourceDto } from 'src/dto/update-data-source.dto'
import { wrapQuery } from 'src/utils/wrap-query'
import { CredentialsService } from 'src/modules/credentials/credentials.service'
import { ConnectorService } from 'src/modules/connector/connector.service'
import { google } from 'googleapis'
import { SuggestCodeDto } from 'src/dto/suggest-code.dto'
import { Logger } from 'winston'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { isBoolean } from 'src/utils/is-boolean'
import { IWorkspace } from 'src/interfaces/workspace'
import { REQUEST } from '@nestjs/core'
import { AddContextDataSourceDto } from 'src/dto/add-context-data-source.dto'
import * as sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { Resend } from 'resend'
import { TablesLoadedEmail } from 'src/emails/tables_loaded'
import { Response } from 'express'
import { sleep } from 'src/utils/sleep'
import { s3 } from 'src/singletons/aws'

interface ColumnSchema {
  selected?: boolean
  column: string
  type: string
  description?: string
  enum?: Array<string>
  columns?: Array<ColumnSchema>
  jsonColumns?: Array<ColumnSchema>
}

interface TableSchema {
  table: string
  description?: string
  columns: ColumnSchema[]
  selected?: boolean
}

export interface SchemaSchema {
  schema: string
  tables: TableSchema[]
}

@Injectable({ scope: Scope.REQUEST })
export class AppService {
  private openai: OpenAI
  private resend = new Resend(process.env.RESEND_API_KEY)

  constructor(
    private readonly prismaService: PrismaService,
    private readonly credentialsService: CredentialsService,
    private readonly connectorService: ConnectorService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @Inject(REQUEST) private request: Request,
  ) {
    this.openai = new OpenAI()
  }

  async isWorkspaceOwner({
    user,
    workspace,
  }: {
    user: User
    workspace: IWorkspace
  }) {
    const userWorkspaces = await this.prismaService.userWorkspace.findFirst({
      where: {
        workspaceId: workspace.workspaceId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return userWorkspaces.userId === user.id
  }

  private async recursivelyAddDescriptionIntoSchema({
    schemas,
    response,
    percentage,
  }: {
    schemas: Array<SchemaSchema>
    response: Response
    percentage: number
  }) {
    const schemasWithDescription: Array<SchemaSchema> = []

    let count = 0
    const total = schemas.length

    const everySchemaPercentage = 50 / total

    for (const schema of schemas) {
      count++

      this.logger.info(
        `Recursively adding description into schema ${count}/${total}`,
        {
          schema: schema.schema,
        },
      )

      const chunks = this.splitSchema({ schema })

      const chunksWithDescription = []

      let totalChunks = chunks.length

      const everyChunkPercentage = everySchemaPercentage / totalChunks

      for (let i = 0; i < chunks.length; i += 10) {
        const chunkBatch = chunks.slice(i, i + 10)

        await Promise.all(
          chunkBatch.map(async (chunk) => {
            percentage += everyChunkPercentage

            response.write(percentage + '\n')

            totalChunks--

            this.logger.info(
              `Recursively adding description into schema ${count}/${total} - chunk ${totalChunks}/${chunks.length}`,
              {
                schema: schema.schema,
              },
            )

            let chunkWithDescription: SchemaSchema

            const needsCompletion = this.verifyIfNeedsCompletion({ chunk })

            if (needsCompletion) {
              const completion = await this.openai.chat.completions.create({
                messages: [
                  {
                    role: 'system',
                    content:
                      'You are a helpful assistant designed to output JSON with presumed description of a column, table or sub columns based on schema and name. If already described, maintain the description.',
                  },
                  {
                    role: 'user',
                    content:
                      'Add a all the descriptions and return the same json structure' +
                      JSON.stringify(chunk),
                  },
                ],
                model: 'gpt-3.5-turbo',
                response_format: { type: 'json_object' },
              })

              try {
                chunkWithDescription = JSON.parse(
                  completion.choices[0].message.content,
                )
              } catch (error) {
                this.logger.error(
                  `Error parsing completion for chunk ${totalChunks}/${chunks.length}`,
                  {
                    schema: schema.schema,
                    error,
                  },
                )

                chunkWithDescription = chunk
              }

              const untilNeedsCompletion = this.verifyIfNeedsCompletion({
                chunk: chunkWithDescription,
              })

              if (untilNeedsCompletion) {
                this.logger.warn(
                  `Chunk ${totalChunks}/${chunks.length} still needs completion`,
                  {
                    schema: schema.schema,
                  },
                )
              }
            } else {
              chunkWithDescription = chunk
            }

            chunksWithDescription.push(chunkWithDescription)
          }),
        )

        await sleep(2000)
      }

      const joinedSchema = this.joinChunks({ chunks: chunksWithDescription })

      schemasWithDescription.push(joinedSchema)
    }

    return schemasWithDescription
  }

  private splitSchema({ schema }: { schema: SchemaSchema }) {
    const chunks: Array<SchemaSchema> = []

    schema.tables.forEach((table) => {
      let currentChunk = {
        ...schema,
        tables: [{ ...table, columns: [] }],
      }

      table.columns.forEach((column) => {
        const tempChunk = JSON.parse(JSON.stringify(currentChunk))
        tempChunk.tables[0].columns.push(column)

        if (encode(JSON.stringify(tempChunk)).length > 7000) {
          chunks.push(currentChunk)

          currentChunk = {
            ...schema,
            tables: [{ ...table, columns: [column] }],
          }
        } else {
          currentChunk.tables[0].columns.push(column)
        }
      })
      chunks.push(currentChunk)
    })

    return chunks
  }

  private joinChunks({ chunks }: { chunks: Array<SchemaSchema> }) {
    const joinedSchema = { schema: chunks[0].schema, tables: [] }

    chunks.forEach((chunk) => {
      const table = chunk.tables[0]
      const existingTable = joinedSchema.tables.find(
        (t) => t.table === table.table,
      )
      if (existingTable) {
        existingTable.columns = existingTable.columns.concat(table.columns)
      } else {
        joinedSchema.tables.push(table)
      }
    })

    return joinedSchema
  }

  async getDataSources({
    readyOnly,
    workspace,
  }: {
    readyOnly: boolean
    workspace: IWorkspace
  }): Promise<Array<Pick<Workspace, 'name' | 'id'>>> {
    return this.prismaService.dataSource.findMany({
      where: {
        workspaceId: workspace.workspaceId,
        ...(readyOnly && { isReady: true }),
      },
      select: {
        name: true,
        id: true,
        engine: true,
        lastSyncAt: true,
        isReady: true,
      },
    })
  }

  async listThreads({
    user,
    workspace,
  }: {
    user: User
    workspace: IWorkspace
  }): Promise<Record<string, Array<Thread>>> {
    const threads = await this.prismaService.thread.findMany({
      where: {
        ownerId: user.id,
        workspaceId: workspace.workspaceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const threadsGroupedByDay = threads.reduce(
      (acc: Record<string, Thread[]>, thread) => {
        const date = isThisWeek(new Date(thread.createdAt))
          ? format(new Date(thread.createdAt), 'EEEE')
          : format(new Date(thread.createdAt), 'dd/MM/yyyy')

        if (acc[date]) {
          acc[date].push(thread)

          return acc
        }

        acc[date] = [thread]

        return acc
      },
      {},
    )

    return threadsGroupedByDay
  }

  async getThreadById({
    threadId,
    user,
    workspace,
  }: {
    threadId: string
    user: User
    workspace: IWorkspace
  }) {
    const { id: userId } = user
    const { workspaceId } = workspace

    const thread = await this.prismaService.thread.findUnique({
      where: {
        id: threadId,
        ownerId: userId,
        workspaceId,
      },
    })

    if (!thread) {
      throw new NotFoundException('Thread not found')
    }

    const messages = await this.prismaService.message.findMany({
      where: {
        threadId: thread.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return {
      messages: messages.map((message) => JSON.parse(message.data as string)),
    }
  }

  async runQueryEndpoint({
    query,
    arguments: argumentsQuery,
    dataSourceId,
    workspace,
  }: RunQueryDto & {
    workspace: IWorkspace
  }) {
    const foundedDataSource = await this.prismaService.dataSource.findUnique({
      where: {
        id: dataSourceId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!foundedDataSource) {
      throw new NotFoundException('DataSource not found')
    }

    if (foundedDataSource.engine === 'Mongo') {
      const { collection: collectionName, aggregateParams } =
        typeof query === 'string' ? JSON.parse(query) : query

      const rows = await this.connectorService.runQueryByProvider({
        dataSourceId: foundedDataSource.id,
        provider: foundedDataSource.engine,
        query: {
          collectionName,
          aggregateParams,
        },
      })

      return rows
    }

    const sql = query.toLowerCase()

    const writeOperations = [
      'insert ',
      'update ',
      'delete ',
      'create ',
      'drop ',
      'alter ',
    ]

    if (writeOperations.some((operation) => sql.includes(operation))) {
      throw new ForbiddenException('Write operations are not allowed')
    }

    const handlebarsFiltersRegex = /{{\s*?([\w\s]+?)\s*?}}/gm

    const replacedFiltersFromNormalToRawQuery = query.replace(
      handlebarsFiltersRegex,
      (_match, p1: string) => {
        const blankSpaceRegex = /\s/gm

        return `{{{${p1.replace(blankSpaceRegex, '_').toLowerCase()}}}}`
      },
    )

    const template = Handlebars.compile(replacedFiltersFromNormalToRawQuery)

    const filtersWithQuotes = Object.entries(argumentsQuery || {}).reduce(
      (acc, [key, value]) => {
        if (/'.+?'/gm.test(value)) {
          acc[key] = value

          return acc
        }

        acc[key] = `'${value}'`

        return acc
      },
      {},
    )

    const replacedFiltersQuery = template(filtersWithQuotes || {})

    try {
      const wrappedQuery = wrapQuery({
        query: replacedFiltersQuery,
      })

      const rows = await this.connectorService.runQueryByProvider({
        query: wrappedQuery,
        provider: foundedDataSource.engine,
        dataSourceId,
      })

      return rows
    } catch (error) {
      throw new BadRequestException(error.message)
    }
  }

  async getWorkspaceInfo({
    workspace,
  }: {
    workspace: IWorkspace
  }): Promise<Partial<Workspace>> {
    return {
      avatar: workspace.Workspace.avatar,
      createdAt: workspace.Workspace.createdAt,
      deletedAt: workspace.Workspace.deletedAt,
      id: workspace.Workspace.id,
      name: workspace.Workspace.name,
      updatedAt: workspace.Workspace.updatedAt,
    }
  }

  async getTables({
    dataSourceId,
    workspace,
  }: {
    dataSourceId: string
    workspace: IWorkspace
  }) {
    const foundedDataSource = await this.prismaService.dataSource.findUnique({
      where: {
        id: dataSourceId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!foundedDataSource) {
      throw new NotFoundException('DataSource not found')
    }

    const rows = await this.getTablesByProvider({
      provider: foundedDataSource.engine,
      dataSourceId,
    })

    return rows
  }

  private async getTablesByProvider({
    provider,
    dataSourceId,
  }: {
    provider: Engines
    dataSourceId: string
  }) {
    if (provider === 'Mongo') {
      return []
    }

    if (provider === 'Postgres' || provider === 'Redshift') {
      const result = await this.connectorService.runQueryByProvider({
        query: `
        SELECT column_name as name
        FROM information_schema.columns
        WHERE table_schema NOT ILIKE 'pg_%'
          AND table_schema NOT ILIKE 'information_schema'
        UNION
        DISTINCT
        SELECT table_name as name
        FROM information_schema.tables
        WHERE table_schema NOT ILIKE 'pg_%'
          AND table_schema NOT ILIKE 'information_schema'`,
        provider,
        dataSourceId,
      })

      return result
    }
  }

  async queryHelp({
    dataSourceId,
    query,
    error,
    workspace,
  }: QueryHelpDto & {
    workspace: IWorkspace
  }) {
    const foundedDataSource = await this.prismaService.dataSource.findUnique({
      where: {
        id: dataSourceId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!foundedDataSource) {
      throw new NotFoundException('DataSource not found')
    }

    const completionExplanation = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful SQL assistant designed to help the users with SQL queries errors. Return only your explanation and DON`T return any code suggestion.',
        },
        {
          role: 'user',
          content: `The following query ${query} is returning the following error: ${error} using ${foundedDataSource.engine}. What is the problem, and how to fix it?`,
        },
      ],
      model: 'gpt-3.5-turbo',
    })

    const completionSuggestion = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful SQL assistant designed to help the users with SQL queries errors. Return only your code suggestion and DON`T return any explanation.',
        },
        {
          role: 'user',
          content: `The following query ${query} is returning the following error: ${error} using ${
            foundedDataSource.engine
          }. What is the problem, and how to fix it? Maintain the same json structure: ${JSON.stringify(
            {
              suggestion: '',
            },
          )}`,
        },
      ],
      response_format: { type: 'json_object' },
      model: 'gpt-3.5-turbo',
    })

    const explanation = completionExplanation.choices[0].message.content
    const suggestion = JSON.parse(
      completionSuggestion.choices[0].message.content,
    ).suggestion

    return { explanation, suggestion }
  }

  async createDataSource({
    dataSourceName: dataSourceName,
    url,
    workspace,
    user,
    provider: bodyProvider,
    file,
  }: CreateDataSourceDto & {
    workspace: IWorkspace
    user: User
    file: Express.Multer.File
  }) {
    const { id: userId } = user

    const foundDataSource = await this.prismaService.dataSource.findFirst({
      where: {
        name: dataSourceName,
        workspaceId: workspace.workspaceId,
      },
    })

    if (foundDataSource) {
      return { dataSourceId: foundDataSource.id }
    }

    const provider = this.getProviderFromUrl({ url, bodyProvider })

    if (!provider) {
      throw new BadRequestException('URL for the connection not supported')
    }

    try {
      const credentials = this.splitUrlInCredentials({ url, provider, file })

      await this.connectorService.testConnectionByProvider({
        provider: provider,
        query: `SELECT 'Test Connection'`,
        credentials,
      })

      const errors = await this.connectorService.validateDataByProvider({
        provider,
        credentials,
      })

      if (errors.length) {
        return {
          reason: 'invalid-data-source',
          errors,
        }
      }

      const createdDataSource = await this.prismaService.dataSource.create({
        data: {
          name: dataSourceName,
          ownerId: userId,
          workspaceId: workspace.workspaceId,
          engine: provider,
        },
      })

      await this.credentialsService.createCredentialsByProvider({
        credentials,
        provider: provider,
        dataSourceId: createdDataSource.id,
      })

      return { dataSourceId: createdDataSource.id }
    } catch (error) {
      throw new BadRequestException(error.message)
    }
  }

  private getProviderFromUrl({
    url,
    bodyProvider,
  }: {
    url: string
    bodyProvider: string
  }): Engines {
    if (bodyProvider) {
      return bodyProvider as Engines
    }

    if (url.includes('https://docs.google.com/spreadsheets')) {
      return Engines.Sheets
    }

    const [provider] = url.split(':')[0].split('+')

    if (provider === 'postgresql') return Engines.Postgres

    if (provider === 'mongodb') return Engines.Mongo

    if (provider === 'redshift') return Engines.Redshift
  }

  private splitUrlInCredentials({
    url,
    provider,
    file,
  }: {
    url: string
    provider: Engines
    file: Express.Multer.File
  }) {
    if (provider === Engines.BigQuery) {
      return file.buffer.toString()
    }

    if (provider === Engines.Sheets) {
      const [, , , , , spreadsheetId] = url.split('/')

      return { spreadsheetId }
    }

    if (provider === Engines.Mongo) return url

    const [user, password] = url.split('@')[0].split('//')[1].split(':')

    const [host, port] = url.split('@')[1].split('/')[0].split(':')

    const dataSourceName = url.split('@')[1].split('/')[1]

    return { user, password, host, dataSourceName, port }
  }

  async getSchemas({
    dataSourceId,
    workspace: workspace,
  }: {
    dataSourceId: string
    workspace: IWorkspace
  }) {
    const foundedDataSource = await this.prismaService.dataSource.findFirst({
      where: {
        id: dataSourceId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!foundedDataSource) {
      throw new NotFoundException('DataSource not found')
    }

    const schemas = await this.connectorService.getSchemasByProvider({
      provider: foundedDataSource.engine,
      dataSourceId: foundedDataSource.id,
    })

    const selectedSchemas = foundedDataSource.rawSchema
      ? JSON.parse(foundedDataSource.rawSchema as string).map(
          (schema: SchemaSchema) => {
            return { name: schema.schema, selected: true }
          },
        )
      : []

    const mappedSchemas = schemas.map((schema: { name: string }) => {
      const selected = selectedSchemas.find(
        (selectedSchema: { name: string }) => {
          return selectedSchema.name === schema.name
        },
      )

      return { name: schema.name, selected: !!selected }
    })

    return mappedSchemas
  }

  async addSchemasIntoDataSource({
    dataSourceId,
    selectedSchemas,
    workspace,
    user,
    response,
  }: AddSchemaDataSourceDto & {
    dataSourceId: string
    workspace: IWorkspace
    user: User
    response: Response
  }) {
    this.logger.info(`Adding schemas into data source ${dataSourceId}`, {
      dataSourceId,
      selectedSchemas,
    })

    const foundedDataSource = await this.prismaService.dataSource.findFirst({
      where: {
        id: dataSourceId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!foundedDataSource) {
      throw new NotFoundException('DataSource not found')
    }

    const rows = await this.connectorService.getDataSourceSchemaByProvider({
      provider: foundedDataSource.engine,
      schemas: selectedSchemas,
      dataSourceId,
    })

    const totalTables = rows.reduce(
      (
        acc: { tables: Array<string>; total: number },
        row: Record<string, string>,
      ) => {
        if (!acc.tables.includes(row.table_name)) {
          acc.tables.push(row.table_name)
          acc.total++

          return acc
        }

        return acc
      },
      { tables: [], total: 0 },
    )

    const tablePercentage = 50 / totalTables.total

    const schemas: Array<SchemaSchema> = []

    let percentage = 0

    for (const row of rows) {
      {
        const schema = schemas.find(
          (schema: SchemaSchema) => schema.schema === row.table_schema,
        )

        const columnData: ColumnSchema = {
          column: row.column_name,
          type: row.data_type,
        }

        const isPostgresEnum =
          row.data_type === 'USER-DEFINED' || row.data_type === 'enum'

        if (isPostgresEnum) {
          const enumValues = await this.getEnumValues({
            provider: foundedDataSource.engine,
            enumTypeName: row.udt_name,
            dataSourceId,
          })

          columnData.enum = enumValues
        }

        const isPostgresOrMongoJson =
          row.data_type === 'json' || row.data_type === 'jsonb'

        const isBigQueryJson =
          (row.data_type as string).startsWith('ARRAY<') ||
          (row.data_type as string).startsWith('STRUCT')

        if (isPostgresOrMongoJson || isBigQueryJson) {
          const jsonColumnsAndTypes = await this.getJsonColumnsAndType({
            columnName: row.column_name,
            tableName: row.table_name,
            provider: foundedDataSource.engine,
            dataSourceId,
            schemaName: row.table_schema,
          })

          if (!jsonColumnsAndTypes) {
            columnData.type = row.data_type
          }

          if (jsonColumnsAndTypes) {
            const { columns: jsonColumns } = jsonColumnsAndTypes

            columnData.jsonColumns = jsonColumns
            columnData.type = row.data_type
          }
        }

        if (schema) {
          const table = schema.tables.find(
            (table: TableSchema) => table.table === row.table_name,
          )

          if (table) {
            table.columns.push(columnData)

            continue
          }

          percentage += tablePercentage

          response.write(percentage + '\n')

          schema.tables.push({
            table: row.table_name,
            columns: [columnData],
          })

          continue
        }

        percentage += tablePercentage

        response.write(percentage + '\n')

        schemas.push({
          schema: row.table_schema,
          tables: [
            {
              table: row.table_name,
              columns: [columnData],
            },
          ],
        })

        continue
      }
    }

    let combinedSchemas = schemas

    if (foundedDataSource.rawSchema) {
      combinedSchemas = this.combineSchemas({
        firstSchema: JSON.parse(foundedDataSource.rawSchema as string),
        secondSchema: schemas,
      })
    }

    this.logger.info(
      `Combined schemas for workspace ${workspace.workspaceId} with ${combinedSchemas.length} schemas`,
    )

    let dataSourceSchema = combinedSchemas

    this.logger.info(
      `Presumed DB description feature is enabled for workspace ${workspace.workspaceId}`,
    )

    dataSourceSchema = await this.recursivelyAddDescriptionIntoSchema({
      schemas: combinedSchemas,
      response,
      percentage,
    })

    const recursiveAddSelected = (column: ColumnSchema) => {
      if (!isBoolean(column.selected)) {
        column.selected = true
      }

      if (column.jsonColumns) {
        if (Array.isArray(column.jsonColumns)) {
          column.jsonColumns.forEach(recursiveAddSelected)

          return
        }

        return
      }

      if (column.columns) {
        column.columns.forEach(recursiveAddSelected)

        return
      }
    }

    const formattedSchemas = dataSourceSchema.reduce(
      (acc: Array<SchemaSchema>, schema) => {
        const formattedSchema = {
          ...schema,
          tables: schema.tables.map((table) => ({
            ...table,
            selected: isBoolean(table.selected) ? table.selected : true,
            columns: table.columns.map((column) => {
              recursiveAddSelected(column)

              return {
                ...column,
                selected: isBoolean(column.selected) ? column.selected : true,
              }
            }),
          })),
        }

        acc.push(formattedSchema)

        return acc
      },
      [] as Array<SchemaSchema>,
    )

    this.logger.info(`Formatted schemas for workspace ${workspace.workspaceId}`)

    this.logger.info(`Updating data source ${dataSourceId}`)

    await this.prismaService.dataSource.update({
      where: {
        id: dataSourceId,
        workspaceId: workspace.workspaceId,
      },
      data: {
        schema: JSON.stringify(dataSourceSchema),
        rawSchema: JSON.stringify(formattedSchemas),
      },
    })

    await this.resend.emails.send({
      from: `Typper BI <${process.env.EMAIL_DOMAIN}>`,
      to: [user.email],
      subject: 'Your Typper BI tables are loaded',
      react: TablesLoadedEmail({
        dataSourceName: foundedDataSource.name,
        dataSourceTablesLink:
          process.env.NODE_ENV === 'development'
            ? `http://localhost:3000/app/data-source/tables?dataSourceId=${dataSourceId}`
            : `https://${process.env.APP_DOMAIN}/app/data-source/tables?dataSourceId=${dataSourceId}`,
      }),
    })

    this.logger.info(`Data source ${dataSourceId} updated`)

    response.end()
  }

  private addSubColumns({
    columns1,
    columns2,
  }: {
    columns1: ColumnSchema[]
    columns2: ColumnSchema[]
  }): ColumnSchema[] {
    const filteredColumns1 = columns1.filter((column1) =>
      columns2.some((column2) => column2.column === column1.column),
    )

    return columns2.map((column2) => {
      const foundColumn = filteredColumns1.find(
        (c) => c.column === column2.column,
      )

      if (foundColumn) {
        if (column2.jsonColumns) {
          foundColumn.jsonColumns = this.addSubColumns({
            columns1: foundColumn.jsonColumns || [],
            columns2: column2.jsonColumns,
          })
        }
        if (column2.columns) {
          foundColumn.columns = this.addSubColumns({
            columns1: foundColumn.columns || [],
            columns2: column2.columns,
          })
        }

        foundColumn.enum = column2.enum
        foundColumn.type = column2.type

        return foundColumn
      } else {
        return column2
      }
    })
  }

  private combineSchemas({
    firstSchema,
    secondSchema,
  }: {
    firstSchema: SchemaSchema[]
    secondSchema: SchemaSchema[]
  }): SchemaSchema[] {
    const filteredFirstSchema = firstSchema.filter((schema1) =>
      secondSchema.some((schema2) => schema2.schema === schema1.schema),
    )

    return secondSchema.map((schema2) => {
      const foundSchema = filteredFirstSchema.find(
        (schema) => schema.schema === schema2.schema,
      )

      if (foundSchema) {
        foundSchema.tables = foundSchema.tables.filter((table1) =>
          schema2.tables.some((table2) => table2.table === table1.table),
        )

        schema2.tables.forEach((table2) => {
          const foundTable = foundSchema.tables.find(
            (table) => table.table === table2.table,
          )

          if (foundTable) {
            foundTable.columns = this.addSubColumns({
              columns1: foundTable.columns,
              columns2: table2.columns,
            })
          } else {
            foundSchema.tables.push(table2)
          }
        })

        return foundSchema
      } else {
        return schema2
      }
    })
  }

  async getJsonColumnsAndType({
    provider,
    columnName,
    tableName,
    dataSourceId,
    schemaName,
  }: {
    columnName: string
    tableName: string
    provider: Engines
    dataSourceId: string
    schemaName: string
  }) {
    const jsonResult = await this.connectorService.getExampleValueByProvider({
      provider: provider,
      columnName,
      tableName,
      dataSourceId,
      schemaName,
    })

    if (!jsonResult || jsonResult?.length === 0) {
      return null
    }

    const processObject = (obj: Record<string, any>) => {
      if (!obj) return []

      return Object.entries(obj).map(([key, value]) => {
        const valueType = typeof value

        if (value === null) {
          return { column: key, type: 'string' }
        }

        if (valueType === 'object') {
          if (Array.isArray(value)) {
            return {
              column: key,
              type: 'array',
              columns: value.length > 0 ? processObject(value[0]) : [],
            }
          } else {
            return {
              column: key,
              type: 'object',
              columns: processObject(value),
            }
          }
        } else {
          return { column: key, type: valueType }
        }
      })
    }

    return {
      columns: processObject(
        Array.isArray(jsonResult[0][columnName])
          ? jsonResult[0][columnName][0]
          : jsonResult[0][columnName],
      ),
    }
  }

  async getEnumValues({
    provider,
    enumTypeName,
    dataSourceId,
  }: {
    enumTypeName: string
    dataSourceId: string
    provider: Engines
  }) {
    if (provider === 'Mongo') {
      return
    }

    const enumQuery = `
        SELECT e.enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = $1`

    const enumResult = await this.connectorService.runQueryByProvider({
      query: enumQuery,
      provider,
      params: [enumTypeName],
      dataSourceId,
    })

    return enumResult.map((row: { enumlabel: string }) => row.enumlabel)
  }

  async getTablesSchema({
    dataSourceId,
    workspace,
  }: {
    dataSourceId: string
    workspace: IWorkspace
  }) {
    if (!workspace) {
      throw new NotFoundException('User must be in a workspace')
    }

    const foundDataSource = await this.prismaService.dataSource.findFirst({
      where: {
        id: dataSourceId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!foundDataSource) {
      throw new NotFoundException('DataSource not found')
    }

    if (!foundDataSource.schema) {
      return []
    }

    return JSON.parse(
      foundDataSource.rawSchema as string,
    ) as Array<SchemaSchema>
  }

  private verifyIfNeedsCompletion({ chunk }: { chunk: SchemaSchema }) {
    let needsCompletion = false

    for (const table of chunk.tables) {
      if (!table.description) {
        needsCompletion = true
        break
      }

      for (const column of table.columns) {
        if (!column.description) {
          needsCompletion = true
          break
        }

        if (column.columns || column.jsonColumns) {
          needsCompletion = this.verifyIfNeedsCompletionSubColumns({
            columns: column.columns || column.jsonColumns,
          })

          if (needsCompletion) {
            break
          }
        }
      }

      if (needsCompletion) break
    }

    return needsCompletion
  }

  private verifyIfNeedsCompletionSubColumns({
    columns,
  }: {
    columns: Array<ColumnSchema>
  }): boolean {
    if (!columns) return false

    let needsCompletion = false

    for (const column of columns) {
      if (!column.description) {
        needsCompletion = true
        break
      }

      if (column.columns || column.jsonColumns) {
        needsCompletion = this.verifyIfNeedsCompletionSubColumns({
          columns: column.columns || column.jsonColumns,
        })

        if (needsCompletion) {
          break
        }
      }
    }

    return needsCompletion
  }

  private filterColumns({
    columns,
    isJsonColumn = false,
  }: {
    columns: Array<ColumnSchema & { selected: boolean }>
    isJsonColumn?: boolean
  }): Array<ColumnSchema> {
    return columns
      .filter((column) => column.selected)
      .map((column) => {
        delete column.selected

        const subColumnKey = isJsonColumn ? 'columns' : 'jsonColumns'
        if (column[subColumnKey]) {
          column[subColumnKey] = this.filterColumns({
            columns: column[subColumnKey] as Array<
              ColumnSchema & { selected: boolean }
            >,
            isJsonColumn: true,
          })
        }

        return column
      })
  }

  async fillTablesSchema({
    dataSourceId,
    schemas,
    workspace,
  }: FillTablesSchemaDto & {
    dataSourceId: string
    workspace: IWorkspace
  }) {
    if (!workspace) {
      throw new NotFoundException('User must be in a workspace')
    }

    const foundDataSource = await this.prismaService.dataSource.findFirst({
      where: {
        id: dataSourceId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!foundDataSource) {
      throw new NotFoundException('DataSource not found')
    }

    if (foundDataSource.isDemo) {
      throw new ForbiddenException('Demo data source cannot be modified')
    }

    const clonedSchemas = JSON.parse(JSON.stringify(schemas))

    const formattedSchemas: Array<SchemaSchema> = clonedSchemas.reduce(
      (acc: Array<SchemaSchema>, schema: SchemaSchema) => {
        const formattedSchema = {
          ...schema,
          tables: schema.tables
            .filter((table) => table.selected)
            .map((table) => {
              delete table.selected

              return {
                ...table,
                columns: this.filterColumns({
                  columns: table.columns as Array<
                    ColumnSchema & { selected: boolean }
                  >,
                }),
              }
            }),
        }

        if (!formattedSchema.tables.length) {
          return acc
        }

        acc.push(formattedSchema)

        return acc
      },
      [],
    )

    if (foundDataSource.engine === 'Sheets') {
      const databaseName = `${workspace.workspaceId}_${foundDataSource.id}`

      const databasePath = await this.getDatabasePath({
        databaseName: databaseName,
      })

      await this.credentialsService.updateCredentialsByProvider({
        credentials: {
          databaseName,
        },
        dataSourceId,
        provider: foundDataSource.engine,
      })

      const connection = await open({
        filename: databasePath,
        driver: sqlite3.Database,
      })

      for (const tables of formattedSchemas[0].tables) {
        const tableName = tables.table
        const columns = tables.columns

        const columnsQuery = this.getColumnsQuery({
          columns,
          tableName,
          withType: true,
        })

        await connection.run(`DROP TABLE IF EXISTS "${tableName}"`)

        await connection.run(
          `CREATE TABLE IF NOT EXISTS "${tableName}" ${columnsQuery}`,
        )
      }

      await connection.close()

      await this.uploadDatabase({ databaseName })

      await this.refreshDataSource({
        dataSourceId,
        workspace: workspace,
      })
    }

    await this.prismaService.dataSource.update({
      where: {
        id: dataSourceId,
        workspaceId: workspace.workspaceId,
      },
      data: {
        schema: JSON.stringify(formattedSchemas),
        isReady: true,
        rawSchema: JSON.stringify(schemas),
      },
    })
  }

  private getColumnsQuery({
    tableName,
    columns,
    withType,
  }: {
    tableName: string
    columns: ColumnSchema[]
    withType?: boolean
  }) {
    let columnsQuery = ''

    const typesMap = {
      string: 'TEXT',
    }

    if (!/[a-zA-Z0-9_]*/.test(tableName)) {
      throw new ForbiddenException('Invalid table name.')
    }

    const validColumnNameRegex = /[a-zA-Z0-9_]*/

    columns.forEach((column, index) => {
      const validColum = validColumnNameRegex.test(column.column)

      if (!validColum) {
        throw new ForbiddenException('Invalid column name.')
      }

      const invalidColumnType = !typesMap[column.type]

      if (invalidColumnType) {
        throw new ForbiddenException('Invalid column type.')
      }

      if (withType) {
        columnsQuery += `"${column.column}" ${typesMap[column.type]}`
      }

      if (!withType) {
        columnsQuery += `"${column.column}"`
      }

      if (index !== columns.length - 1) {
        columnsQuery += ', '
      }
    })

    return `(${columnsQuery})`
  }

  private async uploadDatabase({ databaseName }: { databaseName: string }) {
    const bucketName = process.env.DATASOURCE_S3_BUCKET_NAME

    const srcFilename = path.join(__dirname, `../tmp/${databaseName}.sqlite`)
    const destFilename = `${databaseName}.sqlite`

    const fileContent = readFileSync(srcFilename)

    const params = {
      Bucket: bucketName,
      Key: destFilename,
      Body: fileContent,
    }

    return s3.upload(params).promise()
  }

  private async getDatabasePath({ databaseName }: { databaseName: string }) {
    const bucketName = process.env.DATASOURCE_S3_BUCKET_NAME

    const destFilename = path.join(__dirname, `../tmp/${databaseName}.sqlite`)

    const headObjectParams = {
      Bucket: bucketName,
      Key: `${databaseName}.sqlite`,
    }

    const databaseExists = await s3
      .headObject(headObjectParams)
      .promise()
      .then(() => true)
      .catch(() => false)

    if (!databaseExists) {
      const connection = await open({
        filename: destFilename,
        driver: sqlite3.Database,
      })

      await connection.close()

      return destFilename
    }

    const srcFilename = databaseName

    const downloadParams = {
      Bucket: bucketName,
      Key: `${srcFilename}.sqlite`,
    }

    const fileStream = createWriteStream(destFilename)

    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve)
      fileStream.on('error', reject)
      s3.getObject(downloadParams).createReadStream().pipe(fileStream)
    })

    return destFilename
  }

  async refreshDataSource({
    dataSourceId,
    workspace,
  }: {
    dataSourceId: string
    workspace: IWorkspace
  }) {
    if (!workspace) {
      throw new NotFoundException('User must be in a workspace')
    }

    const foundDataSource = await this.prismaService.dataSource.findFirst({
      where: {
        id: dataSourceId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!foundDataSource) {
      throw new NotFoundException('DataSource not found')
    }

    const schemas = JSON.parse(
      foundDataSource.schema as string,
    ) as Array<SchemaSchema>

    const credentials = await this.credentialsService.getCredentialsByProvider({
      dataSourceId,
      provider: foundDataSource.engine,
    })

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    const pages = await sheets.spreadsheets.get({
      spreadsheetId: credentials.spreadsheetId,
    })

    for (const table of schemas[0].tables) {
      const tablesMap = pages.data.sheets.reduce((acc, page) => {
        const foundEquivalentTable = schemas[0].tables.find(
          (table) =>
            table.table ===
            page.properties.title
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^a-zA-Z0-9 ]/g, '')
              .replace(/ /g, '_'),
        )

        if (!foundEquivalentTable) {
          return acc
        }

        acc[foundEquivalentTable.table] = page.properties.title

        return acc
      }, {})

      const rows = await sheets.spreadsheets.values.get({
        spreadsheetId: credentials.spreadsheetId,
        range: `${tablesMap[table.table]}!A1:Z`,
      })

      const columns = table.columns.map((column) => column.column)

      const rowsFormatted = rows.data.values
        .map((row) => {
          return columns.reduce((acc, column, index) => {
            if (!row.length) return acc

            if (
              row[0]
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-zA-Z0-9 ]/g, '')
                .replace(/ /g, '_') === columns[0]
            ) {
              return acc
            }

            acc[column] = row[index]

            return acc
          }, {})
        })
        .filter((row) => row[columns[0]])

      await this.connectorService.runQueryByProvider({
        dataSourceId,
        provider: foundDataSource.engine,
        params: {},
        query: `DELETE FROM "${table.table}"`,
      })

      const rowsQuery = rowsFormatted
        .map(() => `(${columns.map(() => '?').join(', ')})`)
        .join(', ')

      const columnsQuery = this.getColumnsQuery({
        columns: table.columns,
        tableName: table.table,
      })

      const query = `INSERT INTO "${table.table}" ${columnsQuery} VALUES ${rowsQuery}`

      const values = []

      rowsFormatted.forEach((row) => {
        columns.forEach((column) => {
          values.push(row[column])
        })
      })

      await this.connectorService.runQueryByProvider({
        dataSourceId,
        provider: foundDataSource.engine,
        params: values,
        query: query,
      })
    }

    await this.prismaService.dataSource.update({
      where: {
        id: dataSourceId,
        workspaceId: workspace.workspaceId,
      },
      data: {
        lastSyncAt: new Date(),
      },
    })
  }

  async deleteDataSource({
    dataSourceId,
    workspace,
  }: {
    dataSourceId: string
    workspace: IWorkspace
  }) {
    const foundDataSource = await this.prismaService.dataSource.findFirst({
      where: {
        id: dataSourceId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!foundDataSource) {
      throw new NotFoundException('DataSource not found')
    }

    await this.prismaService.report.deleteMany({
      where: {
        dataSourceId,
      },
    })

    await this.prismaService.dataSource.delete({
      where: {
        id: dataSourceId,
      },
    })

    try {
      if (foundDataSource.engine === 'Sheets') {
        const databaseName = `${workspace.workspaceId}_${foundDataSource.id}`

        const deleteObjectParams = {
          Bucket: process.env.DATASOURCE_S3_BUCKET_NAME,
          Key: `${databaseName}.sqlite`,
        }

        await s3.deleteObject(deleteObjectParams).promise()
      }
    } catch (error) {
      this.logger.error(error)
    }

    try {
      await this.credentialsService.deleteCredentialsByProvider({
        dataSourceId: foundDataSource.id,
        provider: foundDataSource.engine,
      })
    } catch (error) {
      this.logger.error(error)
    }
  }

  async updateDataSource({
    dataSourceId,
    dataSourceName,
    workspace,
  }: UpdateDataSourceDto & { dataSourceId: string; workspace: IWorkspace }) {
    const foundDataSource = await this.prismaService.dataSource.findFirst({
      where: {
        id: dataSourceId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!foundDataSource) {
      throw new NotFoundException('DataSource not found')
    }

    await this.prismaService.dataSource.update({
      where: {
        id: dataSourceId,
      },
      data: {
        name: dataSourceName,
      },
    })
  }

  async downloadFile({ fileId }: { fileId: string }) {
    const fileBuffer = await (
      await this.openai.files.content(fileId)
    ).arrayBuffer()
    const fileName = (await this.openai.files.retrieve(fileId)).filename

    return { fileBuffer, fileName }
  }

  async suggestCode({
    code,
    language,
  }: SuggestCodeDto & { workspace: IWorkspace }) {
    try {
      if (!code) return ''

      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: 'assistant',
            content: `You are a Helpful and Powerful ${
              language === 'Mongo' ? 'Mongo Query' : 'SQL'
            } Assistant, complete the ${
              language === 'Mongo' ? 'Mongo Query' : 'SQL'
            } of the user based on the code provided. Return ONLY the REST of the code!`,
          },
          {
            role: 'user',
            content: `Here is the json with the code (use the 'suggestion_code' field to suggest the rest of the code) ${JSON.stringify(
              {
                code,
                suggestion_code: '',
              },
            )} maintain the same json structure.`,
          },
        ],
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
      })

      const { suggestion_code: suggestedCode } = JSON.parse(
        completion.choices[0].message.content || '{}',
      )

      if (!suggestedCode) return ''

      return suggestedCode
    } catch (error) {
      this.logger.error(error)

      return ''
    }
  }

  async suggestReportDetails({ query }: { query: string }) {
    try {
      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: 'assistant',
            content:
              'You are a Helpful and Powerful Report Assistant, suggest a report name and description based on report query.',
          },
          {
            role: 'user',
            content: `Here is the JSON with the report query (use the 'report_name' and 'report_description' fields to suggest the report details) ${JSON.stringify(
              {
                query,
                report_name: '',
                report_description: '',
              },
            )} maintain the same JSON structure.`,
          },
        ],
        model: 'gpt-3.5-turbo',
        response_format: { type: 'json_object' },
      })

      const { report_name: reportName, report_description: reportDescription } =
        JSON.parse(completion.choices[0].message.content || '{}')

      return {
        reportName: reportName || '',
        reportDescription: reportDescription || '',
      }
    } catch (error) {
      this.logger.error(error)

      return ''
    }
  }

  async finishSetup({ user }: { user: User }) {
    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        shouldSetup: false,
      },
    })
  }

  async getDataSourceContext({
    dataSourceId,
    workspace,
  }: {
    dataSourceId: string
    workspace: IWorkspace
  }) {
    const dataSource = await this.prismaService.dataSource.findFirst({
      where: {
        id: dataSourceId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!dataSource) {
      throw new NotFoundException('DataSource not found')
    }

    if (dataSource.context instanceof Array) {
      return dataSource.context
    }

    return typeof dataSource.context === 'string'
      ? JSON.parse(dataSource.context)
      : []
  }

  async setDataSourceContext({
    dataSourceId,
    body,
    workspace,
  }: {
    dataSourceId: string
    body: AddContextDataSourceDto
    workspace: IWorkspace
  }) {
    const { context } = body

    const dataSource = await this.prismaService.dataSource.findFirst({
      where: {
        id: dataSourceId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!dataSource) {
      throw new NotFoundException('DataSource not found')
    }

    const contextFormatted = context && context.length > 0 ? context : []

    await this.prismaService.dataSource.update({
      where: {
        id: dataSourceId,
      },
      data: {
        context: contextFormatted || null,
      },
    })
  }

  async getDataSource({
    dataSourceId,
    workspace,
  }: {
    dataSourceId: string
    workspace: IWorkspace
  }) {
    const dataSource = await this.prismaService.dataSource.findFirst({
      where: {
        id: dataSourceId,
        workspaceId: workspace.workspaceId,
      },
      select: {
        name: true,
        engine: true,
      },
    })

    if (!dataSource) {
      throw new NotFoundException('DataSource not found')
    }

    return dataSource
  }
}
