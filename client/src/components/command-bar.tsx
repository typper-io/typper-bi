'use client'

import { useEffect } from 'react'
import { Code, Database, Moon, Plus, Sun, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import Link from 'next/link'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

interface CommandBarProps {
  commandBarOpen: boolean
  handleCommandBarOpen: () => void
  handleCommandBarClose: () => void
  setCommandBarOpen: (open: boolean) => void
}

export function CommandBar({
  commandBarOpen,
  handleCommandBarOpen,
  handleCommandBarClose,
  setCommandBarOpen,
}: CommandBarProps) {
  const { setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (commandBarOpen) {
          handleCommandBarClose()
        }

        if (!commandBarOpen) {
          handleCommandBarOpen()
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        handleCommandBarClose()
      }

      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        router.push('/app/chat')
      }

      if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        router.push('/app/query')
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [router, commandBarOpen, handleCommandBarClose, handleCommandBarOpen])

  return (
    <CommandDialog open={commandBarOpen} onOpenChange={setCommandBarOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <Link href="/app/chat">
            <CommandItem>
              <Plus className="mr-2 h-4 w-4" />
              <span>New chat</span>
              <CommandShortcut>⌘J</CommandShortcut>
            </CommandItem>
          </Link>
          <Link href="/app/query">
            <CommandItem>
              <Code className="mr-2 h-4 w-4" />
              <span>Query</span>
              <CommandShortcut>⌘D</CommandShortcut>
            </CommandItem>
          </Link>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => setTheme('light')}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light mode</span>
          </CommandItem>
          <CommandItem onSelect={() => setTheme('dark')}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark mode</span>
          </CommandItem>
          <Link href="/app/data-source">
            <CommandItem>
              <Database className="mr-2 h-4 w-4" />
              <span>Data sources</span>
            </CommandItem>
          </Link>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
