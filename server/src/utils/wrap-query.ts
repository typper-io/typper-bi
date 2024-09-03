export const wrapQuery = ({
  query,
  limit,
}: {
  query: string
  limit?: number
}) => {
  const queryWithoutSemicolon = query.replace(/;/gm, '')

  return `
      WITH query AS (${queryWithoutSemicolon})
      SELECT * FROM query
      LIMIT ${limit || 1000}
    `
}
