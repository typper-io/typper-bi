import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { User } from '@prisma/client'
import { Resend } from 'resend'
import { InviteToWorkspaceDto } from 'src/dto/invite-to-workspace.dto'
import { InviteEmail } from 'src/emails/invite'
import { IWorkspace } from 'src/interfaces/workspace'
import { PrismaService } from 'src/modules/prisma/prisma.service'

@Injectable({ scope: Scope.REQUEST })
export class WorkspaceService {
  resend = new Resend(process.env.RESEND_API_KEY)

  constructor(private readonly prismaService: PrismaService) {}

  private async foundOrCreateUser(email: string) {
    const foundUser = await this.prismaService.user.findFirst({
      where: {
        email,
      },
    })

    if (foundUser) {
      return foundUser
    }

    return this.prismaService.user.create({
      data: {
        email,
      },
    })
  }

  async inviteToWorkspace({
    emails,
    workspace,
    user,
  }: InviteToWorkspaceDto & {
    workspace: IWorkspace
    user: User
  }) {
    let invitedUsers = 0

    for (const email of emails) {
      const foundOrCreatedUser = await this.foundOrCreateUser(email)

      const userAlreadyInWorkspace =
        await this.prismaService.userWorkspace.findFirst({
          where: {
            userId: foundOrCreatedUser.id,
            workspaceId: workspace.Workspace.id,
          },
        })

      if (userAlreadyInWorkspace) {
        continue
      }

      await this.resend.emails.send({
        from: `Typper BI <${process.env.EMAIL_DOMAIN}>`,
        to: [email],
        subject: '[New] You have been invited to a workspace',
        react: InviteEmail({
          userName: user?.name,
          workspaceName: workspace?.Workspace?.name,
          workspaceLink: `https://${process.env.APP_DOMAIN}`,
        }),
      })

      await this.prismaService.userWorkspace.create({
        data: {
          userId: foundOrCreatedUser.id,
          workspaceId: workspace.Workspace.id,
        },
      })

      invitedUsers++
    }

    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        shouldSetup: false,
      },
    })
  }

  async getSetupChecklist({ workspace }: { workspace: IWorkspace }) {
    const dataSources = await this.prismaService.dataSource.findFirst({
      where: {
        workspaceId: workspace.Workspace.id,
      },
    })

    const reports = await this.prismaService.report.findFirst({
      where: {
        workspaceId: workspace.Workspace.id,
      },
    })

    const dashboards = await this.prismaService.dashboard.findFirst({
      where: {
        workspaceId: workspace.Workspace.id,
      },
    })

    return {
      dataSources: !!dataSources,
      reports: !!reports,
      dashboards: !!dashboards,
    }
  }

  async getWorkspaceMembers({ workspace }: { workspace: IWorkspace }) {
    const members = await this.prismaService.userWorkspace.findMany({
      where: {
        workspaceId: workspace.Workspace.id,
      },
      include: {
        User: true,
      },
    })

    return members.map(({ User }) => {
      return {
        id: User.id,
        name: User.name,
        email: User.email,
        createdAt: User.createdAt,
      }
    })
  }

  async removeWorkspaceMember({
    userId,
    workspace,
    user,
  }: {
    workspace: IWorkspace
    userId: string
    user: User
  }) {
    const userWorkspace = await this.prismaService.userWorkspace.findFirst({
      where: {
        workspaceId: workspace.Workspace.id,
        userId,
      },
    })

    if (!userWorkspace) {
      throw new BadRequestException('User not found in this workspace')
    }

    if (userWorkspace.userId === user.id) {
      throw new BadRequestException('You cannot remove yourself')
    }

    const userWorkspaceCount = await this.prismaService.userWorkspace.count({
      where: {
        workspaceId: workspace.Workspace.id,
      },
    })

    if (userWorkspaceCount === 1) {
      throw new BadRequestException(
        'You cannot remove the last member of the workspace',
      )
    }

    await this.prismaService.userWorkspace.delete({
      where: {
        id: userWorkspace.id,
      },
    })
  }
}
