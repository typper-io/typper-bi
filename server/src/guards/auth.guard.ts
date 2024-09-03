import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { decode } from 'next-auth/jwt'
import { PrismaService } from 'src/modules/prisma/prisma.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<Request>()

      const token =
        request.cookies['__Secure-next-auth.session-token'] ||
        request.cookies['next-auth.session-token']

      const workspaceId = request.cookies['workspace-id']

      if (!token) {
        throw new UnauthorizedException()
      }

      const decoded = await decode({
        token,
        secret: process.env.JWT_SECRET,
      })

      const user = await this.prismaService.user.findFirst({
        where: { email: decoded.email },
      })

      if (!user) {
        throw new UnauthorizedException()
      }

      request['user'] = user

      if (!workspaceId) {
        const firstWorkspace = await this.prismaService.userWorkspace.findFirst(
          {
            where: {
              userId: user.id,
            },
            include: {
              Workspace: true,
            },
            orderBy: {
              updatedAt: 'desc',
            },
          },
        )

        if (!firstWorkspace) {
          throw new UnauthorizedException()
        }

        request['workspace'] = firstWorkspace

        return true
      }

      const workspace = await this.prismaService.userWorkspace.findFirst({
        where: {
          userId: user.id,
          workspaceId: workspaceId,
        },
        include: {
          Workspace: true,
        },
      })

      if (!workspace) {
        throw new UnauthorizedException()
      }

      request['workspace'] = workspace

      return true
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }

      throw new UnauthorizedException()
    }
  }
}
