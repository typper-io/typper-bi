import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from '@prisma/client'
import { CreateDashboardDto } from 'src/dto/create-dashboard.dto'
import { UpdateDashboardDto } from 'src/dto/update-dashboard.dto'
import { IWorkspace } from 'src/interfaces/workspace'
import { PrismaService } from 'src/modules/prisma/prisma.service'

@Injectable()
export class DashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  async createDashboard({
    name,
    workspace: workspace,
    user,
  }: CreateDashboardDto & {
    workspace: IWorkspace
    user: User
  }) {
    const { id: userId } = user

    if (!workspace) {
      throw new NotFoundException('User does not belong to any workspace')
    }

    const createdDashboard = await this.prismaService.dashboard.create({
      data: {
        name,
        owner: {
          connect: {
            id: userId,
          },
        },
        workspace: {
          connect: {
            id: workspace.workspaceId,
          },
        },
      },
    })

    return { createdDashboard: createdDashboard.id }
  }

  async listDashboards({ workspace }: { workspace: IWorkspace }) {
    if (!workspace) {
      throw new NotFoundException('User does not belong to any workspace')
    }

    return this.prismaService.dashboard.findMany({
      where: {
        workspaceId: workspace.workspaceId,
      },
    })
  }

  async getDashboardById({
    dashboardId,
    workspace,
  }: {
    dashboardId: string
    workspace: IWorkspace
  }) {
    if (!workspace) {
      throw new NotFoundException('User does not belong to any workspace')
    }

    const foundDashboard = this.prismaService.dashboard.findUnique({
      where: {
        id: dashboardId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!foundDashboard) {
      throw new NotFoundException('Dashboard not found')
    }

    return foundDashboard
  }

  async updateDashboard({
    name,
    widgets,
    dashboardId,
    workspace,
  }: UpdateDashboardDto & {
    dashboardId: string
    workspace: IWorkspace
  }) {
    if (!workspace) {
      throw new NotFoundException('User does not belong to any workspace')
    }

    const foundDashboard = await this.prismaService.dashboard.findFirst({
      where: {
        id: dashboardId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!foundDashboard) {
      throw new NotFoundException('Dashboard not found')
    }

    await this.prismaService.dashboard.update({
      where: {
        id: dashboardId,
      },
      data: {
        name,
        ...(widgets && { widgets: JSON.stringify(widgets) }),
      },
    })
  }

  async deleteDashboard({
    dashboardId,
    workspace,
  }: {
    dashboardId: string
    workspace: IWorkspace
  }) {
    if (!workspace) {
      throw new NotFoundException('User does not belong to any workspace')
    }

    const foundDashboard = await this.prismaService.dashboard.findFirst({
      where: {
        id: dashboardId,
        workspaceId: workspace.workspaceId,
      },
    })

    if (!foundDashboard) {
      throw new NotFoundException('Dashboard not found')
    }

    await this.prismaService.dashboard.delete({
      where: {
        id: foundDashboard.id,
      },
    })
  }
}
