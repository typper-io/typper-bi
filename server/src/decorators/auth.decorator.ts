import { applyDecorators, UseGuards } from '@nestjs/common'
import { AuthGuard } from 'src/guards/auth.guard'

export const Auth = () => applyDecorators(UseGuards(AuthGuard))
