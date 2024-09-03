/* eslint-disable react-hooks/exhaustive-deps */
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
  Plus,
  Settings2Icon,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { columns } from '@/components/team/columns'
import { DataTable } from '@/components/team/data-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/services/api'
import { Input } from '@/components/ui/input'
import Fuse from 'fuse.js'
import _ from 'lodash'

export interface Member {
  id: string
  name: string
  email: string
  createdAt: string
}

export default function Team() {
  const [members, setMembers] = useState<Member[]>([])
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [searchPattern, setSearchPattern] = useState('')
  const [searchResults, setSearchResults] = useState<Array<Member>>([])

  const fetchMembers = async () => {
    const { data } = await api.get('/workspace/members')

    setMembers(data)
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  const fuseSearch = useCallback(
    (pattern: string) => {
      const fuseOptions = {
        shouldSort: false,
        keys: ['name', 'email'],
      }

      const fuse = new Fuse(members, fuseOptions)

      return fuse.search(pattern)
    },
    [members]
  )

  const debouncedSearch = useCallback(
    _.debounce((pattern) => {
      const results = fuseSearch(pattern)

      setSearchResults(results.map((result) => result.item))
    }, 500),
    [fuseSearch]
  )

  useEffect(() => {
    if (searchPattern) {
      debouncedSearch(searchPattern)
    } else {
      setSearchResults([])
    }

    return () => {
      debouncedSearch.cancel()
    }
  }, [searchPattern, debouncedSearch])

  const table = useReactTable({
    data: searchPattern ? searchResults : members,
    columns: columns({
      fetchMembers,
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
        <p className="leading-9 text-3xl font-semibold">Team</p>
        <div className="flex gap-4">
          <Input
            type="search"
            value={searchPattern}
            onChange={(event) => setSearchPattern(event.target.value)}
            className="bg-secondary/80"
            placeholder="Search..."
          />

          <Link href="/app/team/invite">
            <Button variant="secondary" className="gap-2">
              <Plus size={16} />
              Add members
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" className="gap-2 bg-transparent">
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
