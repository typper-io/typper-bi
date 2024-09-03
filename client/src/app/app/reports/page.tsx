'use client'

import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  ArrowDown10,
  ArrowDownAZ,
  ArrowUp10,
  ArrowUpAZ,
  Settings2Icon,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { columns } from '@/components/reports/columns'
import { DataTable } from '@/components/reports/data-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { api } from '@/services/api'

export interface Report {
  id: string
  name: string
  description: string
  dataSourceId: string
  ownerId: string
  threadId: string
  location: any
  workspaceId: string
  display: string
  arguments?: string
  customizations?: string
  query: string
  createdAt: string
  updatedAt: string
  deletedAt: any
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  const fetchReports = async () => {
    const { data } = await api.get('/report')

    setReports(data)
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const table = useReactTable({
    data: reports,
    columns: columns({
      fetchReports,
    }),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className="bg-accent/50 w-full p-8 rounded-xl h-full flex flex-col gap-8">
      <div className="flex justify-between">
        <p className="leading-9 text-3xl font-semibold">Charts and reports</p>
        <div className="flex gap-4">
          <Input
            placeholder="Search..."
            className="w-[300px] bg-secondary/80"
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(e) =>
              table.getColumn('name')?.setFilterValue(e.currentTarget.value)
            }
          />

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="secondary" className="gap-2">
                <Settings2Icon size={16} />
                Order by
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => table.getColumn('name')?.toggleSorting(false)}
              >
                <ArrowDownAZ size={16} />
                Ascending
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => table.getColumn('name')?.toggleSorting(true)}
              >
                <ArrowUpAZ size={16} />
                Descending
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() =>
                  table.getColumn('createdAt')?.toggleSorting(true)
                }
              >
                <ArrowDown10 size={16} />
                Most recent
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() =>
                  table.getColumn('createdAt')?.toggleSorting(false)
                }
              >
                <ArrowUp10 size={16} />
                Oldest
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DataTable table={table} />
    </div>
  )
}
