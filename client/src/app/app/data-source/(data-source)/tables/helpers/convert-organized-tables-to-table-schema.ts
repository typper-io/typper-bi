import {
  OrganizedTables,
  SubTable,
} from '@/app/app/data-source/(data-source)/tables/helpers/sub-table-organizer.helper'
import {
  ColumnSchema,
  TableSchema,
} from '@/app/app/data-source/(data-source)/tables/page'

export const convertOrganizedTablesToTableSchema = (
  organizedTables: OrganizedTables
) => {
  const createColumn = ({
    subTable,
    name,
  }: {
    subTable: SubTable
    name: string
  }) => {
    return {
      column: name,
      type: subTable.type,
      selected: subTable.selected,
      description: subTable.description,
      // ...(subTable.enum && { enum: subTable.enum }),
      columns: subTable.columns ? [...subTable.columns] : undefined,
    }
  }

  const addNestedColumns = ({
    path,
    subTable,
    table,
  }: {
    path: string
    subTable: SubTable
    table: TableSchema
  }) => {
    let parts = path.split('/')
    let currentColumn = table.columns.find((col) => col.column === parts[0])

    if (!currentColumn) {
      currentColumn = createColumn({ subTable, name: parts[0] })
      table.columns.push(currentColumn)
    }

    for (let i = 1; i < parts.length; i++) {
      let existingColumn: ColumnSchema | undefined =
        currentColumn.columns!.find((col) => col.column === parts[i])

      if (!existingColumn) {
        let newColumn = createColumn({ subTable, name: parts[i] })
        currentColumn.columns!.push(newColumn)
        existingColumn = newColumn
      }

      currentColumn = existingColumn
    }
  }

  const { name, columns, subTables, selected, description } = organizedTables

  const tableSchema = {
    table: name,
    selected,
    description,
    columns: [...columns],
  }

  if (subTables && subTables.length > 0) {
    subTables.sort((a, b) => {
      if (a.name < b.name) return -1
      else if (a.name > b.name) return 1
      else return 0
    })

    subTables.forEach((subTable) => {
      const subTableName = subTable.name.split('/')
      subTableName.shift()
      const path = subTableName.join('/')

      addNestedColumns({ path, subTable, table: tableSchema })
    })
  }

  const formattedSchema = tableSchema.columns.map((col) => {
    return {
      ...col,
      columns: undefined,
      jsonColumns: col.columns,
    }
  })

  return {
    ...tableSchema,
    columns: formattedSchema,
  }
}
