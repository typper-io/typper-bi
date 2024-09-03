'use client'

import { DotsThree } from '@phosphor-icons/react'
import { Edit2, LayoutDashboard, Loader2, Trash } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/services/api'

export function DataTableRowActions({
  selectedDashboards,
  dashboardId,
  dashboardName,
  fetchDashboards,
  isHeader,
  clearSelectedRows,
}: {
  selectedDashboards?: Array<string>
  dashboardId?: string
  dashboardName?: string
  isHeader?: boolean
  fetchDashboards: () => void
  clearSelectedRows: () => void
}) {
  const [editingDashboardNameDialogOpen, setEditingDashboardNameDialogOpen] =
    useState(false)
  const [newName, setNewName] = useState('')
  const [deletingDashboardDialogOpen, setDeletingDashboardDialogOpen] =
    useState(false)
  const [loadingRenameDashboard, setLoadingRenameDashboard] = useState(false)
  const [loadingDeleteDashboard, setLoadingDeleteDashboard] = useState(false)

  const handleRenameDashboard = useCallback(async () => {
    if (!dashboardId && !selectedDashboards) return

    if (selectedDashboards) {
      return
    }

    setLoadingRenameDashboard(true)

    await api.put(`/dashboard/${dashboardId}`, {
      name: newName,
    })

    setLoadingRenameDashboard(false)
    setEditingDashboardNameDialogOpen(false)
    toast('Dashboard renamed', {
      action: {
        label: 'Dismiss',
        onClick: () => toast.dismiss(),
      },
    })
    clearSelectedRows?.()
    fetchDashboards()
  }, [
    clearSelectedRows,
    dashboardId,
    fetchDashboards,
    newName,
    selectedDashboards,
  ])

  const handleDeleteDashboard = useCallback(async () => {
    if (!dashboardId && !selectedDashboards) return

    setLoadingDeleteDashboard(true)

    if (selectedDashboards) {
      for (const dashboardId of selectedDashboards) {
        await api.delete(`/dashboard/${dashboardId}`)
      }
    }

    if (dashboardId) {
      await api.delete(`/dashboard/${dashboardId}`)
    }

    setLoadingDeleteDashboard(false)
    setDeletingDashboardDialogOpen(false)
    toast('Dashboard deleted', {
      action: {
        label: 'Dismiss',
        onClick: () => toast.dismiss(),
      },
    })
    clearSelectedRows?.()
    fetchDashboards()
  }, [clearSelectedRows, dashboardId, fetchDashboards, selectedDashboards])

  return (
    <>
      <Dialog
        open={editingDashboardNameDialogOpen}
        onOpenChange={setEditingDashboardNameDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename dashboard</DialogTitle>
          </DialogHeader>
          <div className="flex w-full gap-4 items-center">
            <Label htmlFor="link" className="w-36 text-right truncate">
              Name
            </Label>
            <Input
              id="link"
              defaultValue={dashboardName}
              onChange={(event) => {
                setNewName(event.target.value)
              }}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={loadingRenameDashboard}
              onClick={handleRenameDashboard}
              className="gap-2"
            >
              {loadingRenameDashboard && (
                <Loader2 size={16} className="animate-spin" />
              )}
              Rename dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletingDashboardDialogOpen}
        onOpenChange={setDeletingDashboardDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete dashboard</DialogTitle>
            <DialogDescription>This action is irreversible.</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingDashboardDialogOpen(false)}
            >
              Do not delete
            </Button>

            <Button
              variant="destructive"
              onClick={handleDeleteDashboard}
              disabled={loadingDeleteDashboard}
              className="gap-2"
            >
              {loadingDeleteDashboard && (
                <Loader2 size={16} className="animate-spin" />
              )}
              Delete dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="w-full justify-end flex">
            <Button
              variant="ghost"
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            >
              <DotsThree className="h-4 w-4" />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[170px]">
          {!isHeader && (
            <>
              <Link href={`/app/dashboard/${dashboardId}`}>
                <DropdownMenuItem className="gap-2">
                  <LayoutDashboard size={16} />
                  Open dashboard
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => {
                  setEditingDashboardNameDialogOpen(true)
                }}
              >
                <Edit2 size={16} />
                Rename
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem
            className="gap-2"
            onClick={() => {
              setDeletingDashboardDialogOpen(true)
            }}
          >
            <Trash size={16} />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
