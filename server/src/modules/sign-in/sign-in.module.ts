import { Module } from '@nestjs/common'
import { CredentialsModule } from 'src/modules/credentials/credentials.module'
import { PrismaModule } from 'src/modules/prisma/prisma.module'
import { SignInController } from 'src/modules/sign-in/sign-in.controller'
import { SignInService } from 'src/modules/sign-in/sign-in.service'

@Module({
  imports: [PrismaModule, CredentialsModule],
  controllers: [SignInController],
  providers: [SignInService],
})
export class SignInModule {}
