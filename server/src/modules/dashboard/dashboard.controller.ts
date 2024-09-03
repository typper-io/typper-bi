import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { Auth } from 'src/decorators/auth.decorator'
import { User } from 'src/decorators/user.decorator'
import { CreateDashboardDto } from 'src/dto/create-dashboard.dto'
import { UpdateDashboardDto } from 'src/dto/update-dashboard.dto'
import { DashboardService } from 'src/modules/dashboard/dashboard.service'
import { User as PrismaUser } from '@prisma/client'
import { Workspace } from 'src/decorators/workspace.decorator'
import { IWorkspace } from 'src/interfaces/workspace'

@Auth()
@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post('/dashboard')
  async createDashboard(
    @User() user: PrismaUser,
    @Body() createDashboardDto: CreateDashboardDto,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.dashboardService.createDashboard({
      ...createDashboardDto,
      workspace,
      user,
    })
  }

  @Get('/dashboard')
  async listDashboards(@Workspace() workspace: IWorkspace) {
    return this.dashboardService.listDashboards({ workspace })
  }

  @Get('/dashboard/:dashboardId')
  async getDashboardById(
    @Param('dashboardId') dashboardId: string,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.dashboardService.getDashboardById({
      dashboardId,
      workspace,
    })
  }

  @Put('/dashboard/:dashboardId')
  async updateDashboard(
    @Body() updateDashboardDto: UpdateDashboardDto,
    @Param('dashboardId') dashboardId: string,
    @Workspace() workspace: IWorkspace,
  ) {
    return this.dashboardService.updateDashboard({
      ...updateDashboardDto,
      workspace,
      dashboardId,
    })
  }

  @Delete('/dashboard/:dashboardId')
  async deleteDashboard(
    @Body() { dashboardId }: { dashboardId: string },
    @Workspace() workspace: IWorkspace,
  ): Promise<void> {
    return this.dashboardService.deleteDashboard({
      workspace,
      dashboardId,
    })
  }
}
