import { Injectable } from '@nestjs/common'
import { SignInOrSignUpDto } from 'src/dto/sign-in-or-signup.dto'
import { PrismaService } from 'src/modules/prisma/prisma.service'

@Injectable()
export class SignInService {
  constructor(private readonly prismaService: PrismaService) {}

  async signInOrSignUp({ email, avatar, name }: SignInOrSignUpDto) {
    const upsertUser = await this.prismaService.user.upsert({
      where: {
        email,
      },
      create: {
        email,
        avatar,
        name,
        shouldSetup: false,
      },
      update: {
        avatar,
        name,
      },
    })

    const userWorkspace = await this.prismaService.userWorkspace.findFirst({
      where: {
        userId: upsertUser.id,
      },
    })

    if (!userWorkspace) {
      const workspace = await this.prismaService.workspace.create({
        data: {
          name: `${upsertUser.name}'s workspace`,
          assistantId: process.env.DEMO_ASSISTANT_ID,
        },
      })

      await this.prismaService.userWorkspace.create({
        data: {
          userId: upsertUser.id,
          workspaceId: workspace.id,
        },
      })
    }

    return {
      shouldOnboard: upsertUser.shouldSetup,
    }
  }
}
