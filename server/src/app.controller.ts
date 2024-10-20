import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Response,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { AppService, SchemaSchema } from './app.service'
import { Auth } from 'src/decorators/auth.decorator'
import { User } from 'src/decorators/user.decorator'
import {
  Workspace as PrismaWorkspace,
  User as PrismaUser,
} from '@prisma/client'
import { RunQueryDto } from 'src/dto/run-query.dto'
import { QueryHelpDto } from 'src/dto/query-help.dto'
import { CreateDataSourceDto } from 'src/dto/create-data-source.dto'
import { AddSchemaDataSourceDto } from 'src/dto/add-schema-data-source.dto'
import { FillTablesSchemaDto } from 'src/dto/fill-tables-schema.dto'
import { UpdateDataSourceDto } from 'src/dto/update-data-source.dto'
import { Response as ExpressResponse } from 'express'
import { SuggestCodeDto } from 'src/dto/suggest-code.dto'
import { SuggestReportDetailsDto } from 'src/dto/suggest-report-details.dto'
import { Workspace } from 'src/decorators/workspace.decorator'
import { IWorkspace } from 'src/interfaces/workspace'
import { AddContextDataSourceDto } from 'src/dto/add-context-data-source.dto'
import { FileInterceptor } from '@nestjs/platform-express'

@Auth()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/data-sources')
  async getDataSources(
    @Query('readyOnly') readyOnly: boolean,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.appService.getDataSources({ workspace, readyOnly })
  }

  @Get('/thread')
  async listThreads(
    @User() user: PrismaUser,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.appService.listThreads({ user, workspace })
  }

  @Get('/thread/:threadId')
  async getThreadById(
    @Param('threadId') threadId: string,
    @User() user: PrismaUser,
    @Workspace() workspace: IWorkspace,
  ): Promise<any> {
    return this.appService.getThreadById({ threadId, user, workspace })
  }

  @Post('/query')
  async runQuery(
    @Body() body: RunQueryDto,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.appService.runQueryEndpoint({ ...body, workspace })
  }

  @Post('/query/help')
  async queryHelp(
    @Body() body: QueryHelpDto,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.appService.queryHelp({ ...body, workspace })
  }

  @Get('/workspace')
  async getWorkspace(
    @Workspace() workspace: IWorkspace,
  ): Promise<Partial<PrismaWorkspace>> {
    return this.appService.getWorkspaceInfo({ workspace })
  }

  @Get('/user')
  async getUser(
    @User() user: PrismaUser,
    @Workspace() workspace: IWorkspace,
  ): Promise<
    PrismaUser & {
      isWorkspaceOwner: boolean
    }
  > {
    const isWorkspaceOwner = await this.appService.isWorkspaceOwner({
      user,
      workspace,
    })

    return { ...user, isWorkspaceOwner }
  }

  @Get('/data-source/:dataSourceId/tables')
  async getTables(
    @Param('dataSourceId') dataSourceId: string,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.appService.getTables({ dataSourceId, workspace })
  }

  @Post('/data-source')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        files: 1,
        fileSize: 1024 * 5,
      },
      fileFilter(_req, file, callback) {
        const allowedMimeTypes = ['application/json']

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new ForbiddenException('Only json files are allowed!'),
            false,
          )
        }

        callback(null, true)
      },
    }),
  )
  async createDataSource(
    @Body() body: CreateDataSourceDto,
    @User() user: PrismaUser,
    @Workspace() workspace: IWorkspace,
    @Response() response: ExpressResponse,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (body.provider === 'BigQuery') {
      if (!file) {
        return response
          .status(HttpStatus.BAD_REQUEST)
          .json({ errors: ['File is required for BigQuery'] })
      }
    }

    const dataSource = await this.appService.createDataSource({
      ...body,
      user,
      workspace,
      file,
    })

    if (dataSource.errors) {
      return response.status(HttpStatus.BAD_REQUEST).json(dataSource)
    }

    return response.json(dataSource)
  }

  @Get('/data-source/:dataSourceId/schemas')
  async getSchemas(
    @Param('dataSourceId') dataSourceId: string,
    @Workspace() workspace: IWorkspace,
  ): Promise<any> {
    return this.appService.getSchemas({ dataSourceId, workspace })
  }

  @Post('/data-source/:dataSourceId/schemas')
  async addSchema(
    @Param('dataSourceId') dataSourceId: string,
    @Body() body: AddSchemaDataSourceDto,
    @Workspace() workspace: IWorkspace,
    @User() user: PrismaUser,
    @Response() response: ExpressResponse,
  ) {
    return this.appService.addSchemasIntoDataSource({
      ...body,
      dataSourceId,
      workspace,
      user,
      response,
    })
  }

  @Get('/data-source/:dataSourceId/tables-schema')
  async getTablesSchema(
    @Param('dataSourceId') dataSourceId: string,
    @Workspace() workspace: IWorkspace,
  ): Promise<Array<SchemaSchema>> {
    return this.appService.getTablesSchema({ dataSourceId, workspace })
  }

  @Post('/data-source/:dataSourceId/tables-schema')
  async fillTablesSchema(
    @Param('dataSourceId') dataSourceId: string,
    @Body() body: FillTablesSchemaDto,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.appService.fillTablesSchema({
      ...body,
      dataSourceId,
      workspace,
    })
  }

  @Delete('/data-source/:dataSourceId')
  async deleteDataSource(
    @Param('dataSourceId') dataSourceId: string,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.appService.deleteDataSource({ dataSourceId, workspace })
  }

  @Put('/data-source/:dataSourceId')
  async updateDataSource(
    @Param('dataSourceId') dataSourceId: string,
    @Body() body: UpdateDataSourceDto,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.appService.updateDataSource({
      ...body,
      dataSourceId,
      workspace,
    })
  }

  @Get('/file/:fileId')
  async downloadFile(
    @Param('fileId') fileId: string,
    @Response() res: ExpressResponse,
  ) {
    const { fileBuffer, fileName } = await this.appService.downloadFile({
      fileId,
    })

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`)
    res.setHeader('Content-Length', fileBuffer.byteLength)

    return res.send(Buffer.from(fileBuffer))
  }

  @Post('/data-source/refresh/:dataSourceId')
  async refreshDataSource(
    @Param('dataSourceId') dataSourceId: string,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.appService.refreshDataSource({
      workspace,
      dataSourceId,
    })
  }

  @Post('/suggest/code')
  async suggestCode(
    @Body() body: SuggestCodeDto,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.appService.suggestCode({ ...body, workspace })
  }

  @Post('/suggest/report/details')
  async suggestReportDetails(@Body() body: SuggestReportDetailsDto) {
    return this.appService.suggestReportDetails(body)
  }

  @Post('/onboarding/finish')
  async finishSetup(@User() user: PrismaUser) {
    return this.appService.finishSetup({ user })
  }

  @Get('/data-source/:dataSourceId/context')
  async getDataSourceContext(
    @Param('dataSourceId') dataSourceId: string,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.appService.getDataSourceContext({ dataSourceId, workspace })
  }

  @Post('/data-source/:dataSourceId/context')
  async setContext(
    @Param('dataSourceId') dataSourceId: string,
    @Body() body: AddContextDataSourceDto,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.appService.setDataSourceContext({
      dataSourceId,
      body,
      workspace,
    })
  }

  @Get('/data-source/:dataSourceId')
  async getDataSource(
    @Param('dataSourceId') dataSourceId: string,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.appService.getDataSource({ dataSourceId, workspace })
  }
}
