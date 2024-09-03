import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'

@Injectable()
export class ApiKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()

    const token = request.headers['x-api-key']

    if (!token) {
      throw new UnauthorizedException()
    }

    if (token === process.env.API_KEY) {
      return true
    }

    throw new UnauthorizedException()
  }
}
