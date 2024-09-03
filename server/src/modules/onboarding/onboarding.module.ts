import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/modules/prisma/prisma.module'
import { OnboardingController } from 'src/modules/onboarding/onboarding.controller'
import { OnboardingService } from 'src/modules/onboarding/onboarding.service'

@Module({
  controllers: [OnboardingController],
  providers: [OnboardingService],
  imports: [PrismaModule],
})
export class OnboardingModule {}
