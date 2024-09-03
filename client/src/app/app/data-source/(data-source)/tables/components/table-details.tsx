import { MutableRefObject } from 'react'

import { SubTableWrapper } from '@/app/app/data-source/(data-source)/tables/components/sub-table-wrapper'
import { TableRowWrapper } from '@/app/app/data-source/(data-source)/tables/components/table-row-wrapper'
import { OrganizedTables } from '@/app/app/data-source/(data-source)/tables/helpers/sub-table-organizer.helper'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  Table,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

export const TableDetails = ({
  table,
  tableIndex,
  toggleTable,
  toggleSubTable,
  toggleColumn,
  toggleSubColumn,
  updateTableDescription,
  updateSubTableDescription,
  updateSubColumnDescription,
  updateColumnDescription,
  errors,
  errorRefs,
}: {
  toggleTable: (tableIndex: number) => void
  toggleSubTable: (tableIndex: number, subTableIndex: number) => void
  toggleColumn: ({
    tableIndex,
    columnIndex,
  }: {
    tableIndex: number
    columnIndex: number
  }) => void
  toggleSubColumn: ({
    tableIndex,
    subTableIndex,
    columnIndex,
  }: {
    tableIndex: number
    subTableIndex: number
    columnIndex: number
  }) => void
  table: OrganizedTables
  tableIndex: number
  updateTableDescription: (tableIndex: number, description: string) => void
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
  updateColumnDescription: ({
    tableIndex,
    columnIndex,
    description,
  }: {
    tableIndex: number
    columnIndex: number
    description: string
  }) => void
  errors: Record<string, string>
  errorRefs: MutableRefObject<Record<string, HTMLInputElement>>
}) => {
  return (
    <div className="bg-muted/50 flex flex-col p-4 gap-8 rounded-lg">
      <div className="flex gap-2 items-center">
        <Switch
          checked={table.selected}
          onCheckedChange={() => toggleTable(tableIndex)}
        />
        <p>{table.name}</p>
      </div>

      {table.selected && (
        <>
          <div className="flex flex-col gap-y-1">
            <Textarea
              placeholder="Description"
              className="bg-secondary/80 resize-none"
              value={table.description}
              onChange={(e) =>
                updateTableDescription(tableIndex, e.target.value)
              }
              ref={(el) => {
                if (!el) return

                errorRefs.current[`${table.name}.description`] =
                  el as unknown as HTMLInputElement
              }}
            />
            {errors[`${table.name}.description`] && (
              <span className="text-sm text-destructive">
                {errors[`${table.name}.description`]}
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
                {table.columns.map((column, columnIndex) => (
                  <TableRowWrapper
                    errorRefs={errorRefs}
                    tableName={table.name}
                    errors={errors}
                    key={column.column}
                    column={column}
                    tableIndex={tableIndex}
                    columnIndex={columnIndex}
                    toggleColumn={toggleColumn}
                    updateColumnDescription={updateColumnDescription}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="border-l border-solid border-foreground/50 pl-8 flex flex-col gap-y-4">
            {table.subTables.map((subTable, subTableIndex) => {
              return (
                <div className="flex flex-col gap-y-4" key={subTableIndex}>
                  <SubTableWrapper
                    errorRefs={errorRefs}
                    errors={errors}
                    subTableIndex={subTableIndex}
                    tableIndex={tableIndex}
                    columns={subTable.columns}
                    tableName={table.name}
                    tableDescription={subTable.description}
                    subTable={subTable}
                    toggleSubTable={toggleSubTable}
                    toggleSubColumn={toggleSubColumn}
                    updateSubTableDescription={updateSubTableDescription}
                    updateSubColumnDescription={updateSubColumnDescription}
                  />
                  <Separator className="my-4" />
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
