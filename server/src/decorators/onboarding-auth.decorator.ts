import { applyDecorators, UseGuards } from '@nestjs/common'
import { OnboardingAuthGuard } from 'src/guards/onboarding-auth.guard'

export const OnboardingAuth = () =>
  applyDecorators(UseGuards(OnboardingAuthGuard))
