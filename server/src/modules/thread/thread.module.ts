import { Module } from '@nestjs/common'
import { ConnectorModule } from 'src/modules/connector/connector.module'
import { CredentialsModule } from 'src/modules/credentials/credentials.module'
import { MongoModule } from 'src/modules/mongo/mongo.module'
import { PrismaModule } from 'src/modules/prisma/prisma.module'
import { SemanticSearchModule } from 'src/modules/semantic-search/semantic-search.module'
import { ThreadController } from 'src/modules/thread/thread.controller'
import { ThreadService } from 'src/modules/thread/thread.service'

@Module({
  controllers: [ThreadController],
  providers: [ThreadService],
  imports: [
    PrismaModule,
    ConnectorModule,
    CredentialsModule,
    MongoModule,
    SemanticSearchModule,
  ],
})
export class ThreadModule {}
