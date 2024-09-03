'use client'

import { format } from 'date-fns'
import { ColumnDef } from '@tanstack/react-table'

import { Checkbox } from '@/components/ui/checkbox'
import { Report } from '@/app/app/reports/page'

import { DataTableRowActions } from './data-table-row-actions'
import { DataTableColumnHeader } from './data-table-column-header'

export const columns = ({
  fetchReports,
}: {
  fetchReports: () => void
}): ColumnDef<Report>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px] max-w-[20px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px] max-w-[20px]"
      />
    ),
    size: 30,
    maxSize: 30,
    minSize: 30,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Name"
        className="text-muted-foreground font-semibold w-[500px]"
      />
    ),
    cell: ({ row }) => (
      <div className="w-[500px] truncate">{row.getValue('name')}</div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Created At"
        className="text-muted-foreground font-semibold w-[80px]"
      />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="w-[80px] truncate font-medium text-muted-foreground">
            {format(row.getValue('createdAt'), 'yyyy/MM/dd')}
          </span>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    id: 'actions',
    header: ({ table }) => {
      return (
        <DataTableRowActions
          selectedReports={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original.id)}
          fetchReports={fetchReports}
          clearSelectedRows={() => table.toggleAllRowsSelected(false)}
        />
      )
    },
    cell: ({ row, table }) => {
      return (
        <DataTableRowActions
          fetchReports={fetchReports}
          reportId={row.original.id}
          clearSelectedRows={() => table.toggleAllRowsSelected(false)}
        />
      )
    },
  },
]
