'use client'

import { format } from 'date-fns'
import { ColumnDef } from '@tanstack/react-table'

import { Member } from '@/app/app/team/page'

import { DataTableRowActions } from './data-table-row-actions'
import { DataTableColumnHeader } from './data-table-column-header'

export const columns = ({
  fetchMembers,
}: {
  fetchMembers: () => void
}): ColumnDef<Member>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Name"
        className="text-muted-foreground font-semibold w-[400px]"
      />
    ),
    cell: ({ row }) => (
      <div className="w-[400px] truncate">{row.getValue('name')}</div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="E-mail"
        className="text-muted-foreground font-semibold w-[400px]"
      />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="w-[400px] truncate font-medium text-muted-foreground">
            {row.getValue('email')}
          </span>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <DataTableRowActions
          fetchMembers={fetchMembers}
          memberId={row.original.id}
        />
      )
    },
  },
]
