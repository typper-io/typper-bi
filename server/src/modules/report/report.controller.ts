import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { User } from 'src/decorators/user.decorator'
import { CreateReportDto } from 'src/dto/create-report.dto'
import { User as PrismaUser } from '@prisma/client'
import { ReportService } from 'src/modules/report/report.service'
import { UpdateReportDto } from 'src/dto/update-report-dto'
import { Auth } from 'src/decorators/auth.decorator'
import { IWorkspace } from 'src/interfaces/workspace'
import { Workspace } from 'src/decorators/workspace.decorator'

@Auth()
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('/')
  async listReports(
    @User() user: PrismaUser,
    @Query('owner') owner: boolean,
    @Query('max') max: number,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.reportService.listReports({ owner, max, user, workspace })
  }

  @Get('/:reportId')
  async getReport(
    @Param('reportId') reportId: string,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.reportService.getReportById({
      reportId,
      workspace,
    })
  }

  @Post('/')
  async createReport(
    @Body() body: CreateReportDto,
    @User() user: PrismaUser,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.reportService.createReport({ ...body, workspace, user })
  }

  @Put('/:reportId')
  updateReport(
    @Body() body: UpdateReportDto,
    @Param('reportId') reportId: string,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.reportService.updateReport({
      body,
      reportId,
      workspace,
    })
  }

  @Delete('/:reportId')
  async deleteReport(
    @Param('reportId') reportId: string,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.reportService.deleteReport({ reportId, workspace })
  }
}
