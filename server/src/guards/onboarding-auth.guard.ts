import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { decode } from 'next-auth/jwt'
import { PrismaService } from 'src/modules/prisma/prisma.service'

@Injectable()
export class OnboardingAuthGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<Request>()

      const token =
        request.cookies['__Secure-next-auth.session-token'] ||
        request.cookies['next-auth.session-token']

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

      return true
    } catch {
      throw new UnauthorizedException()
    }
  }
}
