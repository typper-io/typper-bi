import { Injectable } from '@nestjs/common'
import OpenAI from 'openai'

@Injectable()
export class SemanticSearchService {
  private openai = new OpenAI()

  private async getEmbeddings({ texts }: { texts: Array<string> }) {
    const embeddings = await Promise.all(
      texts.map(async (text: string) => {
        const response = await this.openai.embeddings.create({
          model: 'text-embedding-3-large',
          input: text,
        })

        return response.data[0].embedding
      }),
    )

    return embeddings
  }

  private calculateSimilarity({
    firstEmbedding,
    secondEmbedding,
  }: {
    firstEmbedding: Array<number>
    secondEmbedding: Array<number>
  }) {
    const dotProduct = firstEmbedding.reduce(
      (sum, value, index) => sum + value * secondEmbedding[index],
      0,
    )
    const normA = Math.sqrt(
      firstEmbedding.reduce((sum, value) => sum + value * value, 0),
    )
    const normB = Math.sqrt(
      secondEmbedding.reduce((sum, value) => sum + value * value, 0),
    )
    return dotProduct / (normA * normB)
  }

  async semanticSearch({
    query,
    documents,
    threshold = 0.75,
  }: {
    query: string
    documents: Array<string>
    threshold?: number
  }) {
    const allTexts = [query, ...documents]

    const embeddings = await this.getEmbeddings({
      texts: allTexts,
    })

    const queryEmbedding = embeddings[0]
    const documentEmbeddings = embeddings.slice(1)

    const similarities = documentEmbeddings.map((docEmbedding, index) => {
      const similarity = this.calculateSimilarity({
        firstEmbedding: queryEmbedding,
        secondEmbedding: docEmbedding,
      })

      return {
        document: documents[index],
        similarity: similarity,
      }
    })

    return similarities.filter((item) => item.similarity > threshold)
  }
}
