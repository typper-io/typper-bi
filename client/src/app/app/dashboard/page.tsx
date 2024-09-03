'use client'

import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Loader2, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { DataTable } from '@/components/dashboards/data-table'
import { columns } from '@/components/dashboards/columns'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export default function Dashboards() {
  const [dashboards, setDashboards] = useState<Report[]>([])
  const [rowSelection, setRowSelection] = useState({})
  const [createDashboardDialogOpen, setCreateDashboardDialogOpen] =
    useState(false)
  const [newDataSourceName, setNewDataSourceName] = useState('')
  const [loadingCreateDashboard, setLoadingCreateDashboard] = useState(false)

  const router = useRouter()

  const fetchDashboards = useCallback(async () => {
    const { data } = await api.get('/dashboard')

    setDashboards(data)
  }, [])

  useEffect(() => {
    fetchDashboards()
  }, [fetchDashboards])

  const handleCreateNewDashboard = useCallback(async () => {
    setLoadingCreateDashboard(true)

    const { data } = await api.post('/dashboard', {
      name: newDataSourceName,
    })

    router.push(`/app/dashboard/${data.createdDashboard}`)

    setLoadingCreateDashboard(false)
    setCreateDashboardDialogOpen(false)
    fetchDashboards()
  }, [fetchDashboards, newDataSourceName, router])

  const table = useReactTable({
    data: dashboards,
    columns: columns({
      fetchDashboards,
    }),
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
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
        <p className="leading-9 text-3xl font-semibold">Dashboards</p>
        <Button
          variant="secondary"
          className="gap-2"
          onClick={() => setCreateDashboardDialogOpen(true)}
        >
          <Plus size={16} />
          Add dashboard
        </Button>
      </div>

      <Dialog
        open={createDashboardDialogOpen}
        onOpenChange={setCreateDashboardDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New dashboard</DialogTitle>
          </DialogHeader>
          <div className="flex w-full gap-4 items-center">
            <Label htmlFor="link" className="w-20 text-right">
              Name
            </Label>
            <Input
              id="link"
              onChange={(event) => {
                setNewDataSourceName(event.target.value)
              }}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateNewDashboard}
              disabled={loadingCreateDashboard}
              className="gap-2"
            >
              {loadingCreateDashboard && (
                <Loader2 size={16} className="animate-spin" />
              )}
              Create dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DataTable table={table} />
    </div>
  )
}
