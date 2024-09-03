'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

import { Checkbox } from '@/components/ui/checkbox'
import { Report } from '@/app/app/reports/page'

import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'



export const columns = ({
  fetchDashboards,
}: {
  fetchDashboards: () => void
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
          selectedDashboards={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original.id)}
          dashboardName={
            table.getFilteredSelectedRowModel().rows.length === 1
              ? table.getFilteredSelectedRowModel().rows[0].original.name
              : undefined
          }
          fetchDashboards={fetchDashboards}
          isHeader
          clearSelectedRows={() => table.toggleAllRowsSelected(false)}
        />
      )
    },
    cell: ({ row, table }) => {
      return (
        <DataTableRowActions
          dashboardId={row.original.id}
          dashboardName={row.original.name}
          fetchDashboards={fetchDashboards}
          clearSelectedRows={() => table.toggleAllRowsSelected(false)}
        />
      )
    },
  },
]
