'use client'

import { useCallback, useState } from 'react'

import { CommandBar } from '@/components/command-bar'
import { Menu } from '@/components/menu'

export default function Container({
  children,
  selectWorkspace,
}: {
  children: React.ReactNode
  selectWorkspace: (workspaceId: string) => Promise<void>
}) {
  const [commandBarOpen, setCommandBarOpen] = useState(false)

  const handleCommandBarOpen = useCallback(() => {
    setCommandBarOpen(true)
  }, [])

  const handleCommandBarClose = useCallback(() => {
    setCommandBarOpen(false)
  }, [])

  return (
    <div className="flex h-screen bg-background">
      <CommandBar
        commandBarOpen={commandBarOpen}
        handleCommandBarOpen={handleCommandBarOpen}
        handleCommandBarClose={handleCommandBarClose}
        setCommandBarOpen={setCommandBarOpen}
      />
      <Menu
        handleCommandBarOpen={handleCommandBarOpen}
        selectWorkspace={selectWorkspace}
      />
      <div className="w-full py-4 pr-4 flex flex-col overflow-hidden">
        <div className="w-full flex h-full gap-8 flex-col rounded-xl overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
