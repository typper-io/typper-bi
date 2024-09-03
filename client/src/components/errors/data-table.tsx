import { Table as TableType, flexRender } from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/errors/data-table-pagination'
import { Card } from '@/components/ui/card'

interface DataTableProps {
  table: TableType<{
    columnOrLine: string
    description: string
    page: string
  }>
}

export function DataTable({ table }: DataTableProps) {
  return (
    <Card className="space-y-4 bg-accent/50 px-4 pt-4 h-full justify-between flex flex-col overflow-hidden">
      <div className="rounded-md border h-full overflow-hidden flex">
        {table.getRowModel().rows?.length ? (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        style={{
                          width: header.column.getSize(),
                        }}
                        key={header.id}
                        colSpan={header.colSpan}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-sm font-medium text-muted-foreground">
              No errors found
            </p>
          </div>
        )}
      </div>
      <DataTablePagination table={table} />
    </Card>
  )
}
