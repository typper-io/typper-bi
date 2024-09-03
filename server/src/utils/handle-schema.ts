import { Engines } from '@prisma/client'
import { SchemaSchema } from 'src/app.service'

export const handleSchema = ({
  schema,
  engine,
}: {
  schema: Array<SchemaSchema>
  engine: Engines
}): Record<string, Array<Partial<SchemaSchema>>> => {
  if (engine === 'BigQuery') {
    return {
      datasets: schema.map((schema: SchemaSchema) => ({
        tables: schema.tables,
        dataset: schema.schema,
      })),
    }
  }

  return { schemas: schema }
}
