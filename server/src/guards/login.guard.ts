import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { decode } from 'next-auth/jwt'

@Injectable()
export class LoginAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<Request>()

      const token =
        request.cookies['__Secure-next-auth.session-token'] ||
        request.cookies['next-auth.session-token']

      if (!token) {
        throw new UnauthorizedException()
      }

      await decode({
        token,
        secret: process.env.JWT_SECRET,
      })

      return true
    } catch {
      throw new UnauthorizedException()
    }
  }
}
