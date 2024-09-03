import { FileJson } from 'lucide-react'
import { MutableRefObject } from 'react'

import { TableRowWrapper } from '@/app/app/data-source/(data-source)/tables/components/table-row-wrapper'
import { ColumnSchema } from '@/app/app/data-source/(data-source)/tables/page'
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  Table,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { SubTable } from '@/app/app/data-source/(data-source)/tables/helpers/sub-table-organizer.helper'

export const SubTableWrapper = ({
  tableIndex,
  subTableIndex,
  columns,
  tableName,
  tableDescription,
  toggleSubTable,
  toggleSubColumn,
  subTable,
  updateSubTableDescription,
  updateSubColumnDescription,
  errors,
  errorRefs,
}: {
  toggleSubTable: (tableIndex: number, subTableIndex: number) => void
  toggleSubColumn: ({
    tableIndex,
    subTableIndex,
    columnIndex,
  }: {
    tableIndex: number
    subTableIndex: number
    columnIndex: number
  }) => void
  tableIndex: number
  subTableIndex: number
  columns: ColumnSchema[]
  tableName: string
  tableDescription: string
  subTable: SubTable
  updateSubTableDescription: ({
    tableIndex,
    subTableIndex,
    description,
  }: {
    tableIndex: number
    subTableIndex: number
    description: string
  }) => void
  updateSubColumnDescription: ({
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
}) => {
  const tables = subTable.name.split('/')
  const formattedTableName = tables[tables.length - 1]

  return (
    <div>
      <p className="text-muted-foreground text-xs pb-2">from {tableName}</p>
      <div className="flex items-center gap-x-2">
        <Switch
          checked={subTable.selected}
          onCheckedChange={() => toggleSubTable(tableIndex, subTableIndex)}
        />
        <div className="flex items-center gap-x-1">
          <FileJson size={16} />
          <p className="text-sm">{formattedTableName}</p>
        </div>
      </div>
      {subTable.selected && (
        <>
          <div className="flex flex-col gap-y-1">
            <Textarea
              placeholder="Description"
              className="bg-secondary/80 my-4 resize-none"
              value={tableDescription}
              onChange={(e) =>
                updateSubTableDescription({
                  description: e.target.value,
                  subTableIndex,
                  tableIndex,
                })
              }
              ref={(inputElement) => {
                if (!inputElement) return

                errorRefs.current[`${tableName}.${subTable.name}.description`] =
                  inputElement as unknown as HTMLInputElement
              }}
            />
            {errors[`${tableName}.${subTable.name}.description`] && (
              <span className="text-sm text-destructive">
                {errors[`${tableName}.${subTable.name}.description`]}
              </span>
            )}
          </div>

          <div className="border-input border-solid border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[52px]" />
                  <TableHead>Column</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <>
                  {columns.map((column, columnIndex) => (
                    <TableRowWrapper
                      errorRefs={errorRefs}
                      errors={errors}
                      tableName={`${tableName}.${subTable.name}`}
                      toggleSubColumn={toggleSubColumn}
                      columnIndex={columnIndex}
                      key={column.column}
                      column={column}
                      tableIndex={tableIndex}
                      subTableIndex={subTableIndex}
                      updateSubColumnDescription={updateSubColumnDescription}
                    />
                  ))}
                </>
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
