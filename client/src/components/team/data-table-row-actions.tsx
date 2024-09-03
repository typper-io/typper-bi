'use client'

import { toast } from 'sonner'
import { DotsThree } from '@phosphor-icons/react'
import { Loader2, Trash } from 'lucide-react'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/services/api'

export function DataTableRowActions({
  memberId,
  fetchMembers,
}: {
  memberId?: string
  fetchMembers: () => void
}) {
  const [removingMemberDialogOpen, setRemovingMemberDialogOpen] =
    useState(false)
  const [loadingRemoveMember, setLoadingRemoveMember] = useState(false)

  const handleRemoveMember = useCallback(async () => {
    if (!memberId) return

    setLoadingRemoveMember(true)

    await api.delete(`/workspace/members/${memberId}`)

    setLoadingRemoveMember(false)
    setRemovingMemberDialogOpen(false)
    toast('Member removed', {
      action: {
        label: 'Dismiss',
        onClick: () => toast.dismiss(),
      },
    })
    fetchMembers()
  }, [memberId, fetchMembers])

  return (
    <>
      <Dialog
        open={removingMemberDialogOpen}
        onOpenChange={setRemovingMemberDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
            <DialogDescription>
              You can add it back at any time.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemovingMemberDialogOpen(false)}
            >
              Do not remove
            </Button>

            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={loadingRemoveMember}
              className="gap-2"
            >
              {loadingRemoveMember && (
                <Loader2 size={16} className="animate-spin" />
              )}
              Remove member
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
          <DropdownMenuItem
            className="gap-2"
            onClick={() => {
              setRemovingMemberDialogOpen(true)
            }}
          >
            <Trash size={16} />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
