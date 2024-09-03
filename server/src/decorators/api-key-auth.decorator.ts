import { applyDecorators, UseGuards } from '@nestjs/common'
import { ApiKeyGuard } from 'src/guards/api-key.guard'

export const ApiKeyAuth = () => applyDecorators(UseGuards(ApiKeyGuard))
