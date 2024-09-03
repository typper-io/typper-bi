import { Module } from '@nestjs/common'
import { MongoService } from 'src/modules/mongo/mongo.service'

@Module({
  providers: [MongoService],
  exports: [MongoService],
  imports: [],
})
export class MongoModule {}
