import type { ExecutionContext } from '@nestjs/common'
import { createParamDecorator } from '@nestjs/common'

export const User = createParamDecorator((_, req: ExecutionContext) => {
  const request = req.switchToHttp().getRequest()

  return request.user
})
