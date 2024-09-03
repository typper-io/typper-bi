import { Injectable, Scope } from '@nestjs/common'
import OpenAI from 'openai'

@Injectable({ scope: Scope.REQUEST })
export class MongoService {
  openai: OpenAI

  constructor() {
    this.openai = new OpenAI()
  }

  async extractCollectionAndParams({ query }: { query: string }) {
    const completion = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant designed to parse and output JSON aggregate queries for MongoDB. Return the same Object structure.',
        },
        {
          role: 'user',
          content: `Here is the unparsed query: ${query}. Here is the object structure: ${JSON.stringify(
            {
              collectionName: 'string',
              aggregateParams: 'array',
            },
          )}`,
        },
      ],
      model: 'gpt-3.5-turbo',
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content)

    return {
      collectionName: result.collectionName,
      aggregateParams: result.aggregateParams,
    }
  }
}
