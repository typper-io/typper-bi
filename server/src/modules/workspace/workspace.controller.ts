import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { User } from 'src/decorators/user.decorator'
import { User as PrismaUser } from '@prisma/client'
import { WorkspaceService } from 'src/modules/workspace/workspace.service'
import { InviteToWorkspaceDto } from 'src/dto/invite-to-workspace.dto'
import { Workspace } from 'src/decorators/workspace.decorator'
import { IWorkspace } from 'src/interfaces/workspace'
import { Auth } from 'src/decorators/auth.decorator'

@Auth()
@Controller()
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post('/workspace/invite')
  async inviteToWorkspace(
    @Body() body: InviteToWorkspaceDto,
    @Workspace() workspace: IWorkspace,
    @User() user: PrismaUser,
  ) {
    return this.workspaceService.inviteToWorkspace({ ...body, workspace, user })
  }

  @Get('/workspace/setup/checklist')
  async getSetupChecklist(@Workspace() workspace: IWorkspace) {
    return this.workspaceService.getSetupChecklist({ workspace })
  }

  @Get('/workspace/members')
  async getWorkspaceMembers(@Workspace() workspace: IWorkspace) {
    return this.workspaceService.getWorkspaceMembers({ workspace })
  }

  @Delete('/workspace/members/:userId')
  async removeWorkspaceMember(
    @Workspace() workspace: IWorkspace,
    @Param('userId') userId: string,
    @User() user: PrismaUser,
  ) {
    return this.workspaceService.removeWorkspaceMember({
      workspace,
      userId,
      user,
    })
  }
}
