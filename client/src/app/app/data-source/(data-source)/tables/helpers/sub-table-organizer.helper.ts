import {
  ColumnSchema,
  TableSchema,
} from '@/app/app/data-source/(data-source)/tables/page'

export interface SubTable {
  name: string
  columns: ColumnSchema[]
  selected: boolean
  description: string
  type: string
}

export interface OrganizedTables {
  name: string
  columns: ColumnSchema[]
  subTables: SubTable[]
  selected: boolean
  description: string
}

const flattenSubTable = ({
  columns,
  name,
  flattenedSubTables,
  description,
  type,
  selected,
}: {
  columns: ColumnSchema[]
  name: string
  type: string
  flattenedSubTables: SubTable[]
  description: string
  selected: boolean
}) => {
  const flattenedColumns = []

  for (const column of columns) {
    if (column.columns) {
      flattenSubTable({
        columns: column.columns,
        name: `${name}/${column.column}`,
        flattenedSubTables,
        description: column.description || '',
        type: column.type,
        selected: column.selected,
      })
      continue
    }

    if (column.type !== 'object') {
      flattenedColumns.push(column)
    }
  }

  flattenedSubTables.push({
    columns: flattenedColumns,
    name,
    selected,
    description,
    type,
  })
}

export const subTableOrganizer = (table: TableSchema): OrganizedTables => {
  const basicColumns: ColumnSchema[] = []
  const flattenedSubTables: SubTable[] = []

  for (const column of table.columns) {
    if (column.jsonColumns) {
      flattenSubTable({
        columns: column.jsonColumns,
        name: `${table.table}/${column.column}`,
        flattenedSubTables,
        description: column.description || '',
        type: column.type,
        selected: column.selected,
      })
      continue
    }

    basicColumns.push(column)
    continue
  }

  return {
    description: table.description || '',
    name: table.table,
    columns: basicColumns,
    subTables: flattenedSubTables,
    selected: table.selected,
  }
}
