import { Module } from '@nestjs/common'
import { SemanticSearchService } from 'src/modules/semantic-search/semantic-search.service'

@Module({
  providers: [SemanticSearchService],
  exports: [SemanticSearchService],
})
export class SemanticSearchModule {}
