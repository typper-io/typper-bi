import { BadRequestException, Injectable } from '@nestjs/common'
import { Engines } from '@prisma/client'
import { isValidObjectId } from 'mongoose'
import { Pool } from 'pg'
import { CredentialsService } from 'src/modules/credentials/credentials.service'
import { mongoConnect } from 'src/utils/mongo-connect'
import { google } from 'googleapis'
import * as sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import * as path from 'path'
import { createWriteStream, existsSync, readFileSync, unlinkSync } from 'fs'
import { alphabet } from 'src/constants/alphabet'
import {
  BigQuery,
  BigQueryDate,
  BigQueryDatetime,
  BigQueryInt,
  BigQueryTime,
  BigQueryTimestamp,
} from '@google-cloud/bigquery'
import { s3 } from 'src/singletons/aws'

@Injectable()
export class ConnectorService {
  constructor(private readonly credentialsService: CredentialsService) {}

  async runQueryByProvider({
    provider,
    query,
    dataSourceId,
    ...props
  }: {
    provider: any
    query?: any
    params?: any
    dataSourceId: string
  }) {
    const credentials = await this.credentialsService.getCredentialsByProvider({
      provider,
      dataSourceId,
    })

    if (provider === 'Mongo') {
      const { collectionName, aggregateParams } = query

      if (!collectionName || !aggregateParams) {
        throw new BadRequestException(
          `Collection not found. Only allowed query is {
            collection: 'collection_name',
            aggregateParams: [
              {
                $match: {
                  field: 'value'
                }
              }
            ]
          }`,
        )
      }

      const client = await mongoConnect(credentials)

      const collections = await client.connection.db.listCollections().toArray()

      if (!collections.map(({ name }) => name).includes(collectionName)) {
        throw new BadRequestException(
          `Collection not found. Only allowed query is {
            collection: 'collection_name',
            aggregateParams: [
              {
                $match: {
                  field: 'value'
                }
              }
            ]
          }`,
        )
      }

      const rows = await client.connection.db
        .collection(collectionName)
        .aggregate(aggregateParams)
        .toArray()

      await client.disconnect()

      return rows
    }

    if (provider === 'Postgres' || provider === 'Redshift') {
      const pool = new Pool({
        host: credentials.host,
        database: credentials.dataSourceName,
        password: credentials.password,
        port: Number(credentials.port),
        user: credentials.user,
        ...(process.env.NODE_ENV !== 'development' && {
          ssl: {
            rejectUnauthorized: false,
          },
        }),
        connectionTimeoutMillis: 1000 * 30,
        max: 1,
      })

      const client = await pool.connect()

      const { rows: result } = await client.query(query, props['params'] || [])

      client.release()

      await pool.end()

      return result
    }

    if (provider === 'Sheets') {
      let connection = null
      let dbPath = null

      try {
        dbPath = await this.getDatabasePath(credentials)

        connection = await open({
          filename: dbPath,
          driver: sqlite3.Database,
        })
      } catch (error) {
        throw new BadRequestException('Database not found')
      }

      const rows = await connection.all(query, props.params)

      try {
        await connection.close()

        await this.uploadDatabase(credentials)

        if (existsSync(dbPath)) {
          unlinkSync(dbPath)
        }
      } catch (error) {
        throw new BadRequestException('Error on connect to database')
      }

      return rows
    }

    if (provider === 'BigQuery') {
      const bigquery = new BigQuery({
        credentials: JSON.parse(credentials),
      })

      const [rows] = await bigquery.query({
        query,
        params: props.params,
        parseJSON: true,
      })

      const rowsMapped = rows.map((row) => {
        return Object.fromEntries(
          Object.entries(row).map(([key, value]) => {
            const isBigQueryClass =
              value instanceof BigQueryDate ||
              value instanceof BigQueryDatetime ||
              value instanceof BigQueryTimestamp ||
              value instanceof BigQueryTime ||
              value instanceof BigQueryInt

            if (isBigQueryClass) {
              return [key, value.value]
            }

            return [key, value]
          }),
        )
      })

      return rowsMapped
    }
  }

  private async uploadDatabase({ databaseName }: { databaseName: string }) {
    const bucketName = process.env.DATASOURCE_S3_BUCKET_NAME

    const srcFilename = path.join(
      __dirname,
      `../../../tmp/${databaseName}.sqlite`,
    )

    const destFilename = `${databaseName}.sqlite`

    const fileContent = readFileSync(srcFilename)

    const uploadParams = {
      Bucket: bucketName,
      Key: destFilename,
      Body: fileContent,
    }

    return s3.upload(uploadParams).promise()
  }

  private async getDatabasePath({ databaseName }: { databaseName: string }) {
    const bucketName = process.env.DATASOURCE_S3_BUCKET_NAME

    const destFilename = path.join(
      __dirname,
      `../../../tmp/${databaseName}.sqlite`,
    )

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
      throw new BadRequestException('Database not found')
    }

    const srcFilename = databaseName

    const downloadParams = {
      Bucket: bucketName,
      Key: `${srcFilename}.sqlite`,
    }

    const fileStream = createWriteStream(destFilename)

    await new Promise((resolve, reject) => {
      s3.getObject(downloadParams)
        .createReadStream()
        .pipe(fileStream)
        .on('finish', resolve)
        .on('error', reject)
    })

    return destFilename
  }

  async getSchemasByProvider({
    provider,
    dataSourceId,
  }: {
    provider: Engines
    dataSourceId: string
  }) {
    const credentials = await this.credentialsService.getCredentialsByProvider({
      provider,
      dataSourceId,
    })

    if (provider === 'BigQuery') {
      const bigquery = new BigQuery({
        credentials: JSON.parse(credentials),
      })

      const [rows] = await bigquery.query({
        query: `
        SELECT schema_name AS name
        FROM \`${bigquery.projectId}.INFORMATION_SCHEMA.SCHEMATA\`
        ORDER BY name;
        `,
      })

      return rows
    }

    if (provider === 'Sheets') {
      return [{ name: 'sheets' }]
    }

    if (provider === 'Mongo') {
      const client = await mongoConnect(credentials)

      const db = client.connection.db

      const result = [{ name: db.databaseName }]

      client.disconnect()

      return result
    }

    if (provider === 'Postgres' || provider === 'Redshift') {
      const result = await this.runQueryByProvider({
        query: `
        SELECT table_schema as name
        FROM information_schema.tables
        WHERE table_schema NOT ILIKE 'pg_%'
          AND table_schema NOT ILIKE 'information_schema'
        GROUP BY table_schema`,
        provider,
        dataSourceId,
      })

      return result
    }
  }

  async testConnectionByProvider({
    provider,
    query,
    credentials,
  }: {
    provider: Engines
    query: any
    credentials: any
  }) {
    if (provider === 'BigQuery') {
      const bigquery = new BigQuery({
        credentials: JSON.parse(credentials),
      })

      await bigquery.query({ query })
    }

    if (provider === 'Mongo') {
      const client = await mongoConnect(credentials)

      await client.disconnect()
    }

    if (provider === 'Postgres' || provider === 'Redshift') {
      const pool = new Pool({
        host: credentials.host,
        database: credentials.dataSourceName,
        password: credentials.password,
        port: Number(credentials.port),
        user: credentials.user,
        ...(process.env.NODE_ENV !== 'development' && {
          ssl: {
            rejectUnauthorized: false,
          },
        }),
        connectionTimeoutMillis: 1000 * 30,
        max: 1,
      })

      const client = await pool.connect()

      const { rows: result } = await client.query(query)

      client.release()

      await pool.end()

      return result
    }

    if (provider === 'Sheets') {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })

      const sheets = google.sheets({ version: 'v4', auth })

      await sheets.spreadsheets.get({
        spreadsheetId: credentials.spreadsheetId,
      })
    }
  }

  async getDataSourceSchemaByProvider({
    provider,
    schemas,
    dataSourceId,
  }: {
    schemas: string[]
    provider: Engines
    dataSourceId: string
  }) {
    const credentials = await this.credentialsService.getCredentialsByProvider({
      provider,
      dataSourceId,
    })

    if (provider === 'BigQuery') {
      const results = await Promise.all(
        schemas.map(async (schema) => {
          const tables = await this.runQueryByProvider({
            query: `
              SELECT table_catalog,
                      table_schema,
                      table_name,
                      column_name,
                      data_type,
                      data_type as udt_name
              FROM \`${schema}.INFORMATION_SCHEMA.COLUMNS\`
            `,
            provider,
            dataSourceId,
          })

          return tables
        }),
      )

      return results.flatMap((result) => result)
    }

    if (provider === 'Mongo') {
      const client = await mongoConnect(credentials)

      const db = client.connection.db

      const collections = await db.collections()

      const columns = await Promise.all(
        collections.map(async (collection) => {
          const columns = await collection.find({}).limit(1).toArray()

          const columnNames = Object.keys(columns[0])

          const getTypeof = (value: any) => {
            if (value instanceof Date) {
              return 'timestamp'
            }

            if (isValidObjectId(value)) {
              return 'string'
            }

            if (typeof value === 'object') {
              return 'json'
            }

            if (typeof value === 'string') {
              return 'string'
            }

            if (typeof value === 'number') {
              return 'number'
            }

            if (typeof value === 'boolean') {
              return 'boolean'
            }

            return 'string'
          }

          return columnNames.map((columnName) => {
            const value = columns.map((column) => column[columnName])[0]

            return {
              table_name: collection.collectionName,
              column_name: columnName,
              data_type: getTypeof(value),
              table_schema: db.dataSourceName,
              udt_name: 'string',
            }
          })
        }),
      )

      await client.disconnect()

      return columns.flatMap((column) => column)
    }

    if (provider === 'Postgres' || provider === 'Redshift') {
      const result = await this.runQueryByProvider({
        query: `
        SELECT table_name, column_name, data_type, table_schema, udt_name
        FROM information_schema.columns
        WHERE table_schema NOT ILIKE 'pg_%'
          AND table_schema NOT ILIKE 'information_schema'
          AND table_name NOT ILIKE 'pg_%'
          AND table_schema = ANY($1)`,
        provider,
        params: [schemas],
        dataSourceId,
      })

      return result
    }

    if (provider === 'Sheets') {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })

      const sheets = google.sheets({ version: 'v4', auth })

      const tables = await sheets.spreadsheets.get({
        spreadsheetId: credentials.spreadsheetId,
      })

      const tablesWithoutHidden = tables.data.sheets.filter((sheet) => {
        return !sheet.properties.hidden
      })

      const columns = await Promise.all(
        tablesWithoutHidden.map(async (sheet) => {
          const columns = await sheets.spreadsheets.values.get({
            spreadsheetId: credentials.spreadsheetId,
            range: `${sheet.properties.title}!1:1`,
          })

          if (!columns.data.values) {
            return []
          }

          const columnNames = columns.data.values[0]

          return columnNames.map((columnName) => ({
            table_name: sheet.properties.title
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^a-zA-Z0-9 ]/g, '')
              .replace(/ /g, '_'),
            column_name: columnName
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^a-zA-Z0-9 ]/g, '')
              .replace(/ /g, '_'),
            data_type: 'string',
            table_schema: 'sheets',
            udt_name: 'string',
          }))
        }),
      )

      return columns.flatMap((column) => column)
    }
  }

  async validateDataByProvider({
    provider,
    credentials,
  }: {
    provider: Engines
    credentials: any
  }) {
    const errors = []

    if (provider === 'Sheets') {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })

      const sheets = google.sheets({ version: 'v4', auth })

      const tables = await sheets.spreadsheets.get({
        spreadsheetId: credentials.spreadsheetId,
      })

      const tablesWithoutHidden = tables.data.sheets.filter((sheet) => {
        return !sheet.properties.hidden
      })

      await Promise.all(
        tablesWithoutHidden.map(async (sheet) => {
          const replacedTableName = sheet.properties.title
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .replace(/ /g, '_')

          if (!replacedTableName) {
            errors.push({
              page: sheet.properties.title,
              columnOrLine: '',
              description: 'The table has invalid characters or is empty',
            })
          }

          const allSheets = await sheets.spreadsheets.values.get({
            spreadsheetId: credentials.spreadsheetId,
            range: `${sheet.properties.title}!A1:Z`,
          })

          const pageColumns = allSheets.data.values?.[0] || []

          if (!pageColumns.length) {
            errors.push({
              page: sheet.properties.title,
              columnOrLine: 'Line 1',
              description:
                'The current line used as column name line is empty or has invalid characters. If you want to ignore this page please hide they',
            })
          }

          const rowsFormatted: Record<
            string,
            Array<string>
          > = allSheets.data.values?.reduce((acc, rows, rowIndex) => {
            rows.forEach((cell, cellIndex) => {
              if (rowIndex === 0) {
                acc[cell] = []
              }

              if (rowIndex !== 0) {
                if (!acc[pageColumns[cellIndex]]) {
                  errors.push({
                    page: sheet.properties.title,
                    columnOrLine: `${alphabet[cellIndex].toUpperCase()}${
                      rowIndex + 1
                    }`,
                    description: 'The column has no column title',
                  })

                  return acc
                }

                acc[pageColumns[cellIndex]].push(cell)
              }

              return acc
            }, {})

            return acc
          }, {}) || []

          Object.entries(rowsFormatted).forEach(([columnName, rows], index) => {
            const replacedColumnName = columnName
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^a-zA-Z0-9 ]/g, '')
              .replace(/ /g, '_')

            if (!replacedColumnName) {
              errors.push({
                page: sheet.properties.title,
                columnOrLine: `${alphabet[index].toUpperCase()}1`,
                description: 'The column has invalid characters or is empty',
              })
            }

            if (!rows.length) {
              errors.push({
                page: sheet.properties.title,
                columnOrLine: `${alphabet[index].toUpperCase()}${index + 1}`,
                description: 'The column is empty',
              })
            }
          })
        }),
      )

      return errors
    }

    return []
  }

  async getExampleValueByProvider({
    columnName,
    provider,
    tableName,
    dataSourceId,
    schemaName,
  }: {
    tableName: string
    columnName: string
    provider: Engines
    dataSourceId: string
    schemaName?: string
  }) {
    if (provider === 'Postgres' || provider === 'Redshift') {
      return this.runQueryByProvider({
        query: `SELECT ${columnName} FROM "${tableName}" LIMIT 1`,
        dataSourceId,
        provider,
      })
    }

    if (provider === 'Mongo') {
      const jsonQuery = {
        collection: tableName,
        query: {},
        limit: 1,
      }

      return this.runQueryByProvider({
        query: jsonQuery,
        dataSourceId,
        provider,
      })
    }

    if (provider === 'BigQuery') {
      return this.runQueryByProvider({
        query: `SELECT ${columnName} FROM \`${schemaName}.${tableName}\` LIMIT 1`,
        dataSourceId,
        provider,
      })
    }
  }
}
