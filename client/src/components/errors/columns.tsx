'use client'

import { DataTableColumnHeader } from '@/components/errors/data-table-column-header'
import { ColumnDef } from '@tanstack/react-table'

export const columns: ColumnDef<{
  columnOrLine: string
  description: string
  page: string
}>[] = [
  {
    accessorKey: 'page',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Page"
        className="text-muted-foreground font-semibold w-[150px]"
      />
    ),
    cell: ({ row }) => <div className="truncate">{row.getValue('page')}</div>,
    enableHiding: false,
  },
  {
    accessorKey: 'columnOrLine',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Column/Line"
        className="text-muted-foreground font-semibold w-[150px]"
      />
    ),
    cell: ({ row }) => {
      return <div className="truncate">{row.getValue('columnOrLine')}</div>
    },
    enableHiding: false,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Error description"
        className="text-muted-foreground font-semibold"
      />
    ),
    cell: ({ row }) => {
      return <div className="truncate">{row.getValue('description')}</div>
    },
    enableHiding: false,
  },
]
