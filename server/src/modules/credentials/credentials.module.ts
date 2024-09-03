import { Module } from '@nestjs/common'
import { CredentialsService } from 'src/modules/credentials/credentials.service'

@Module({
  exports: [CredentialsService],
  providers: [CredentialsService],
})
export class CredentialsModule {}
