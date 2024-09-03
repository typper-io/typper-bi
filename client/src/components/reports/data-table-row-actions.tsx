'use client'

import { toast } from 'sonner'
import { DotsThree } from '@phosphor-icons/react'
import { Copy, File, Loader2, Share2, Trash } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useState } from 'react'

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
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/services/api'

export function DataTableRowActions({
  selectedReports,
  reportId,
  fetchReports,
  isHeader,
  clearSelectedRows,
}: {
  selectedReports?: Array<string>
  reportId?: string
  isHeader?: boolean
  fetchReports: () => void
  clearSelectedRows: () => void
}) {
  const [deletingReportDialogOpen, setDeletingReportDialogOpen] =
    useState(false)
  const [loadingDeleteReport, setLoadingDeleteReport] = useState(false)

  const handleDeleteReport = useCallback(async () => {
    if (!reportId && !selectedReports) return

    setLoadingDeleteReport(true)

    if (selectedReports) {
      for (const reportId of selectedReports) {
        await api.delete(`/report/${reportId}`)
      }
    }

    if (reportId) {
      await api.delete(`/report/${reportId}`)
    }

    setLoadingDeleteReport(false)
    setDeletingReportDialogOpen(false)
    toast('Report deleted', {
      action: {
        label: 'Dismiss',
        onClick: () => toast.dismiss(),
      },
    })
    clearSelectedRows?.()
    fetchReports()
  }, [reportId, selectedReports, fetchReports, clearSelectedRows])

  const handleCopyLink = useCallback(() => {
    if (!reportId && !selectedReports) return

    if (selectedReports) {
      let links = ''

      selectedReports.map((reportId) => {
        links += `${window.location.origin}/app/reports/${reportId}\n`
      })

      navigator.clipboard.writeText(links)

      return
    }

    navigator.clipboard.writeText(
      `${window.location.origin}/app/reports/${reportId}`
    )
  }, [selectedReports, reportId])

  return (
    <>
      <Dialog
        open={deletingReportDialogOpen}
        onOpenChange={setDeletingReportDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete report</DialogTitle>
            <DialogDescription>
              By deleting this report, it will be lost forever.
              <br />
              <br />
              You might even be able to create one that does the same thing in
              the future.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingReportDialogOpen(false)}
            >
              Do not delete
            </Button>

            <Button
              variant="destructive"
              onClick={handleDeleteReport}
              disabled={loadingDeleteReport}
              className="gap-2"
            >
              {loadingDeleteReport && (
                <Loader2 size={16} className="animate-spin" />
              )}
              Delete report
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
        <DropdownMenuContent align="end" className="w-[160px]">
          {!isHeader && (
            <>
              <Link href={`/app/reports/${reportId}`}>
                <DropdownMenuItem className="gap-2">
                  <File size={16} />
                  Open report
                </DropdownMenuItem>
              </Link>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2">
                  <Share2 size={16} />
                  Share
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={handleCopyLink}
                    >
                      <Copy size={16} />
                      Copy link
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </>
          )}
          <DropdownMenuItem
            className="gap-2"
            onClick={() => {
              setDeletingReportDialogOpen(true)
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
