'use client'

import { useCallback } from 'react'
import { Table as TableType, flexRender } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/reports/data-table-pagination'
import { Card } from '@/components/ui/card'
import { Report } from '@/app/app/reports/page'

interface DataTableProps {
  table: TableType<Report>
}

export function DataTable({ table }: DataTableProps) {
  const router = useRouter()

  const handleGoToReport = useCallback(
    (dashboardId: string) => {
      router.push(`/app/dashboard/${dashboardId}`)
    },
    [router]
  )

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
                    <TableCell
                      key={cell.id}
                      className="cursor-pointer"
                      onClick={() => {
                        if (
                          cell.column.id === 'select' ||
                          cell.column.id === 'actions'
                        )
                          return

                        handleGoToReport((row.original as Report).id)
                      }}
                    >
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
              No dashboards found
            </p>
          </div>
        )}
      </div>
      <DataTablePagination table={table} />
    </Card>
  )
}
