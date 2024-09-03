import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from 'next-auth'
import { CreateReportDto } from 'src/dto/create-report.dto'
import { UpdateReportDto } from 'src/dto/update-report-dto'
import { IWorkspace } from 'src/interfaces/workspace'
import { PrismaService } from 'src/modules/prisma/prisma.service'

@Injectable()
export class ReportService {
  constructor(private readonly prismaService: PrismaService) {}

  async listReports({
    owner,
    max,
    workspace,
    user,
  }: {
    owner: boolean
    max: number
    workspace: IWorkspace
    user: User
  }) {
    const { id: userId } = user

    if (!workspace) {
      throw new NotFoundException('User must be in a workspace')
    }

    const reports = await this.prismaService.report.findMany({
      where: {
        workspaceId: workspace.workspaceId,
        ...(owner && {
          ownerId: userId,
        }),
      },
      ...(max && { take: Number(max) }),
      orderBy: {
        createdAt: 'desc',
      },
    })

    return reports
  }

  async getReportById({
    reportId,
    workspace,
  }: {
    reportId: string
    workspace: IWorkspace
  }) {
    if (!workspace) {
      throw new NotFoundException('User must be in a workspace')
    }

    const report = await this.prismaService.report.findFirst({
      where: {
        id: reportId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!report) {
      throw new NotFoundException('Report not found')
    }

    return report
  }

  async createReport({
    description,
    name,
    dataSourceId,
    threadId,
    display,
    query,
    arguments: reportArguments,
    customizations,
    workspace,
    user,
  }: CreateReportDto & {
    workspace: IWorkspace
    user: User
  }) {
    const { id: userId } = user

    const createdReport = await this.prismaService.report.create({
      data: {
        arguments: reportArguments
          ? JSON.stringify(reportArguments)
          : undefined,
        workspaceId: workspace.workspaceId,
        description,
        name,
        display,
        customizations: customizations
          ? JSON.stringify(customizations)
          : undefined,
        ...(threadId && {
          thread: {
            connect: {
              id: threadId,
            },
          },
        }),
        query,
        owner: {
          connect: {
            id: userId,
          },
        },
        dataSource: {
          connect: {
            id: dataSourceId,
          },
        },
      },
    })

    return createdReport
  }

  async updateReport({
    body,
    reportId,
    workspace,
  }: {
    body: UpdateReportDto
    reportId: string
    workspace: IWorkspace
  }) {
    const {
      dataSourceId,
      description,
      display,
      name,
      query,
      arguments: reportArguments,
      customizations,
      threadId,
    } = body

    if (!workspace) {
      throw new NotFoundException('User must be in a workspace')
    }

    const report = await this.prismaService.report.findFirst({
      where: {
        id: reportId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!report) {
      throw new NotFoundException('Report not found')
    }

    const updatedReport = await this.prismaService.report.update({
      where: {
        id: reportId,
      },
      data: {
        dataSourceId,
        description,
        display,
        name,
        query,
        arguments: reportArguments
          ? JSON.stringify(reportArguments)
          : undefined,
        customizations: customizations
          ? JSON.stringify(customizations)
          : undefined,
        threadId,
      },
    })

    return updatedReport
  }

  async deleteReport({
    reportId,
    workspace,
  }: {
    reportId: string
    workspace: IWorkspace
  }) {
    if (!workspace) {
      throw new NotFoundException('User must be in a workspace')
    }

    const foundReport = this.prismaService.report.findFirst({
      where: {
        id: reportId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!foundReport) {
      throw new NotFoundException('Report not found')
    }

    await this.prismaService.report.delete({
      where: {
        id: reportId,
      },
    })
  }
}
