import { applyDecorators, UseGuards } from '@nestjs/common'
import { LoginAuthGuard } from 'src/guards/login.guard'

export const LoginAuth = () => applyDecorators(UseGuards(LoginAuthGuard))
