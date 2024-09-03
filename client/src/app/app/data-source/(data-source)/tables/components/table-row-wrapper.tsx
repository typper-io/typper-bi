import { MutableRefObject } from 'react'

import { ColumnSchema } from '@/app/app/data-source/(data-source)/tables/page'
import { Input } from '@/components/ui/input'
import { TableRow, TableCell } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'

export const TableRowWrapper = ({
  tableIndex,
  tableName,
  column,
  columnIndex,
  subTableIndex,
  toggleColumn,
  toggleSubColumn,
  updateColumnDescription,
  updateSubColumnDescription,
  errors,
  errorRefs,
}: {
  tableIndex: number
  subTableIndex?: number
  columnIndex: number
  column: ColumnSchema
  toggleColumn?: ({
    tableIndex,
    columnIndex,
  }: {
    tableIndex: number
    columnIndex: number
  }) => void
  toggleSubColumn?: ({
    tableIndex,
    subTableIndex,
    columnIndex,
  }: {
    tableIndex: number
    subTableIndex: number
    columnIndex: number
  }) => void
  updateColumnDescription?: ({
    tableIndex,
    columnIndex,
    description,
  }: {
    tableIndex: number
    columnIndex: number
    description: string
  }) => void
  updateSubColumnDescription?: ({
    tableIndex,
    subTableIndex,
    columnIndex,
    description,
  }: {
    tableIndex: number
    subTableIndex: number
    columnIndex: number
    description: string
  }) => void
  errors: Record<string, string>
  errorRefs: MutableRefObject<Record<string, HTMLInputElement>>
  tableName: string
}) => {
  return (
    <TableRow>
      <TableCell>
        <Switch
          checked={column.selected}
          onCheckedChange={() => {
            return toggleSubColumn
              ? toggleSubColumn({
                  columnIndex,
                  subTableIndex: subTableIndex!,
                  tableIndex,
                })
              : toggleColumn && toggleColumn({ columnIndex, tableIndex })
          }}
        />
      </TableCell>
      <TableCell>{column.column}</TableCell>
      <TableCell className="flex flex-col gap-y-1">
        <Input
          className="bg-secondary/80"
          value={column.description}
          onChange={(e) =>
            updateSubColumnDescription
              ? updateSubColumnDescription({
                  columnIndex,
                  description: e.target.value,
                  subTableIndex: subTableIndex!,
                  tableIndex,
                })
              : updateColumnDescription!({
                  columnIndex,
                  description: e.target.value,
                  tableIndex,
                })
          }
          ref={(el) => {
            if (!el) return
            errorRefs.current[`${tableName}.${column.column}.description`] = el
          }}
        />
        {errors[`${tableName}.${column.column}.description`] && (
          <span className="text-sm text-destructive truncate">
            {errors[`${tableName}.${column.column}.description`]}
          </span>
        )}
      </TableCell>
    </TableRow>
  )
}
