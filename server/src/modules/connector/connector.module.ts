import { Module } from '@nestjs/common'
import { ConnectorService } from 'src/modules/connector/connector.service'
import { CredentialsModule } from 'src/modules/credentials/credentials.module'
import { PrismaModule } from 'src/modules/prisma/prisma.module'

@Module({
  providers: [ConnectorService],
  exports: [ConnectorService],
  imports: [CredentialsModule, PrismaModule],
})
export class ConnectorModule {}
