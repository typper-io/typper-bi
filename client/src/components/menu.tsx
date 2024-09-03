'use client'

import {
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  Code,
  Database,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  LogOut,
  Moon,
  PieChart,
  Receipt,
  Rocket,
  Search,
  Sparkle,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react'
import { Chat, Plus } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'

import { Separator } from '@/components/ui/separator'
import { api } from '@/services/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tour } from '@/components/tour'
import { useLocalStorage } from '@/hooks/use-localstorage'

type Screens =
  | 'chat'
  | 'reports'
  | 'data-source'
  | 'dashboard'
  | 'home'
  | 'query'
  | 'team'
  | 'plans'
  | ''

interface MenuProps {
  handleCommandBarOpen: () => void
  selectWorkspace: (workspaceId: string) => Promise<void>
}

interface User {
  name: string
  email: string
  avatar: string
  isWorkspaceOwner: boolean
}

const MenuItem = ({
  opened,
  text,
  icon,
  route,
}: {
  opened: boolean
  text: string
  icon: React.ReactNode
  route: string
}) => {
  const path = usePathname()

  const activeTab = useMemo(() => {
    return path.split('/')[2] as Screens
  }, [path])

  const itemTab = useMemo(() => {
    return route.split('/')[2] as Screens
  }, [route])

  if (!opened) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Link
              id={itemTab}
              className={cn(
                'flex gap-2 items-center h-8 w-8 cursor-pointer rounded-md hover:bg-accent/50 justify-center',
                {
                  'bg-accent': activeTab === itemTab,
                }
              )}
              href={route}
            >
              {icon}
            </Link>
          </TooltipTrigger>

          <TooltipContent side="right">
            <p>{text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Link
      id={itemTab}
      className={cn(
        'flex gap-2 items-center h-8 py-2 px-3 cursor-pointer rounded-md hover:bg-accent/50',
        {
          'bg-accent': activeTab === itemTab,
        }
      )}
      href={route}
    >
      {icon}
      <p className="text-sm leading-5 line-clamp-1">{text}</p>
    </Link>
  )
}

export function Menu({ handleCommandBarOpen, selectWorkspace }: MenuProps) {
  const router = useRouter()
  const { theme, setTheme, systemTheme } = useTheme()

  const [workspace, setWorkspace] = useState<{
    name: string
    avatar: string
    isFreePlan: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [workspaces, setWorkspaces] = useState<
    {
      id: string
      name: string
      avatar: string
      members: number
    }[]
  >([])
  const [createWorkspaceDialogOpen, setCreateWorkspaceDialogOpen] =
    useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceAvatar, setWorkspaceAvatar] = useState<File | null>(null)
  const [loadingCreateWorkspace, setLoadingCreateWorkspace] = useState(false)
  const [opened, setOpened] = useLocalStorage<boolean>('menu-open', true)

  useEffect(() => {
    async function loadWorkspace() {
      setLoading(true)

      const { data } = await api.get('/workspace')

      setWorkspace(data)

      setLoading(false)
    }

    const getWorkspaces = async () => {
      setLoading(true)

      const { data: workspacesList } = await api.get('/workspaces')

      setWorkspaces(workspacesList)
      setLoading(false)
    }

    getWorkspaces()

    const fetchUser = async () => {
      setLoading(true)

      const { data } = await api.get('/user')

      setUser(data)
      setLoading(false)
    }

    fetchUser()

    loadWorkspace()
  }, [router])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      workspaces.forEach(async (workspace) => {
        if (
          e.key === `${workspaces.indexOf(workspace) + 1}` &&
          (e.metaKey || e.ctrlKey)
        ) {
          e.preventDefault()
          await selectWorkspace(workspace.id)
          window.location.reload()
          localStorage.removeItem('setup')
        }
      })
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [router, selectWorkspace, workspace, workspaces])

  const createWorkspace = useCallback(async () => {
    try {
      if (!workspaceName || loadingCreateWorkspace) return

      setLoadingCreateWorkspace(true)

      const formData = new FormData()

      formData.append('name', workspaceName)

      if (workspaceAvatar) {
        formData.append('avatar', workspaceAvatar)
      }

      const { data: createdWorkspace } = await api.post('/workspace', formData)

      setLoadingCreateWorkspace(false)
      await selectWorkspace(createdWorkspace.id)
      setCreateWorkspaceDialogOpen(false)

      toast('Workspace created', {
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss(),
        },
      })

      router.push('/team/invite')
    } catch {
      setLoadingCreateWorkspace(false)

      toast('Cannot create workspace', {
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss(),
        },
      })
    }
  }, [
    loadingCreateWorkspace,
    router,
    selectWorkspace,
    workspaceAvatar,
    workspaceName,
  ])

  const workspaceAvatarFallback = useMemo(() => {
    const [first, second] = workspace?.name.split(' ') || []

    return `${first?.[0] || ''}${second?.[0] || ''}`.toUpperCase()
  }, [workspace?.name])

  const userAvatarFallback = useMemo(() => {
    const [first, second] = user?.name?.split(' ') || []

    return `${first?.[0] || ''}${second?.[0] || ''}`.toUpperCase()
  }, [user?.name])

  return (
    <>
      <Dialog
        open={createWorkspaceDialogOpen}
        onOpenChange={setCreateWorkspaceDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New workspace</DialogTitle>
          </DialogHeader>
          <div className="flex w-full gap-4 items-center">
            <Label htmlFor="workspace-name" className="w-24 text-right">
              Name
            </Label>
            <Input
              id="workspace-name"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
            />
          </div>
          <div className="flex w-full gap-4 items-center">
            <Label htmlFor="logo" className="w-24 text-right">
              Logo
            </Label>
            <Input
              id="logo"
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              multiple={false}
              onChange={(event) =>
                setWorkspaceAvatar(event.target.files?.[0] || null)
              }
            />
          </div>
          <DialogFooter>
            <Button
              onClick={createWorkspace}
              disabled={loading}
              className="gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Create workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tour
        id="menu-tour"
        steps={[
          {
            title: 'Chat',
            content:
              'Create graphs, reports or ask questions about anything about your data.',
            target: '#chat',
            placement: 'right-start',
            disableBeacon: true,
          },
          {
            title: 'Dashboards',
            content: 'View and edit all your dashboards.',
            target: '#dashboard',
            placement: 'right-start',
          },
          {
            title: 'Saved reports',
            content:
              'Your saved charts, tables and all reports will be listed here.',
            target: '#reports',
            placement: 'right-start',
          },
          {
            title: 'Query runner',
            content:
              'Do queries on your data. Recommended for more advanced users.',
            target: '#query',
            placement: 'right-start',
          },
          {
            title: 'Data sources',
            content: 'Connect and add your data.',
            target: '#data-source',
            placement: 'right-start',
          },
        ]}
      />

      <div
        style={{ width: opened ? 240 : 72 }}
        className="bg-background py-6 px-4 gap-4 flex flex-col overflow-y-auto"
      >
        {opened ? (
          <>
            <DropdownMenu>
              <div className="w-full justify-between flex items-center">
                <DropdownMenuTrigger className="w-full">
                  <div className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 rounded-sm">
                    <Avatar className="w-8 h-8 rounded-sm items-center shrink-0">
                      <AvatarImage
                        src={workspace?.avatar}
                        className="w-8 h-8 rounded-sm"
                      />
                      <AvatarFallback className="w-8 h-8 rounded-sm">
                        {workspaceAvatarFallback}
                      </AvatarFallback>
                    </Avatar>

                    {loading || !workspace?.name ? (
                      <Skeleton className="w-[100px] h-7" />
                    ) : (
                      <p className="leading-7 text-lg font-semibold truncate w-[100px]">
                        {workspace?.name}
                      </p>
                    )}
                  </div>
                </DropdownMenuTrigger>

                <Button
                  variant="ghost"
                  className="h-8 min-w-8 w-8 p-0 shrink-0"
                  onClick={() => setOpened(!opened)}
                >
                  <ChevronsLeft size={16} />
                </Button>
              </div>

              <DropdownMenuContent className="w-[208px]">
                {workspaces.map((workspace, index) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    className="justify-between"
                    onClick={async () => {
                      await selectWorkspace(workspace.id)
                      window.location.reload()
                      localStorage.removeItem('setup')
                    }}
                  >
                    <p className="w-[70%] truncate">{workspace.name}</p>
                    <p className="text-muted-foreground text-xs">
                      ⌘{index + 1}
                    </p>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => {
                    setCreateWorkspaceDialogOpen(true)
                  }}
                >
                  <Plus size={16} />
                  Create workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator />

            <div className="flex flex-col gap-4 w-full">
              <div
                className="bg-secondary/80 flex py-1 px-3 items-center rounded-md justify-between border-input border border-solid w-full max-w-[320px] h-8"
                onClick={handleCommandBarOpen}
              >
                <div className="bg-transparent border-none px-3 py-1">
                  <p className="text-muted-foreground text-sm leading-5">
                    Search
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">⌘K</p>
              </div>
            </div>

            <Separator />

            <div className="gap-4 flex flex-col justify-between h-full">
              <div className="gap-2 flex flex-col">
                <MenuItem
                  opened={opened}
                  text="Chats"
                  icon={<Chat size={16} />}
                  route="/app/chat"
                />

                <MenuItem
                  opened={opened}
                  text="Dashboard"
                  icon={<LayoutDashboard size={16} />}
                  route="/app/dashboard"
                />

                <MenuItem
                  opened={opened}
                  text="Saved reports"
                  icon={<PieChart size={16} />}
                  route="/app/reports"
                />

                <MenuItem
                  opened={opened}
                  text="Query runner"
                  icon={<Code size={16} />}
                  route="/app/query"
                />

                <MenuItem
                  opened={opened}
                  text="Data sources"
                  icon={<Database size={16} />}
                  route="/app/data-source"
                />
              </div>

              <div className="flex flex-col gap-4">
                <Separator />

                <div className="flex gap-2 flex-col">
                  <div className="flex flex-col gap-2">
                    <MenuItem
                      opened={opened}
                      text="Documentation"
                      icon={<BookOpen size={16} />}
                      route="https://docs.bi.typper.io"
                    />
                  </div>

                  <MenuItem
                    opened={opened}
                    text="Team"
                    icon={<Users size={16} />}
                    route="/app/team"
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <div className="h-10 px-3 gap-2 flex items-center hover:bg-accent/50 rounded-md">
                        <Avatar className="w-4 h-4 shrink-0">
                          <AvatarImage src={user?.avatar} />
                          <AvatarFallback className="w-4 h-4">
                            {userAvatarFallback}
                          </AvatarFallback>
                        </Avatar>

                        {loading ? (
                          <Skeleton className="w-full h-[14px]" />
                        ) : (
                          <p className="truncate text-sm leading-[14px]">
                            {user?.name}
                          </p>
                        )}
                      </div>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-[208px]">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="gap-2">
                          {theme === 'dark' ? (
                            <Moon size={16} />
                          ) : (
                            <Sun size={16} />
                          )}
                          Theme
                        </DropdownMenuSubTrigger>

                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => setTheme(systemTheme || 'light')}
                            >
                              <Sparkles size={16} /> System
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => setTheme('dark')}
                            >
                              <Moon size={16} /> Dark
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => setTheme('light')}
                            >
                              <Sun size={16} /> Light
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      <DropdownMenuSeparator />

                      <Link href="/app/data-source">
                        <DropdownMenuItem className="gap-2">
                          <Database size={16} />
                          Data sources
                        </DropdownMenuItem>
                      </Link>

                      <Link href="https://docs.bi.typper.io" target="_blank">
                        <DropdownMenuItem className="gap-2">
                          <BookOpen size={16} />
                          Documentation
                        </DropdownMenuItem>
                      </Link>

                      <Link
                        href="https://changelog.bi.typper.io"
                        target="_blank"
                      >
                        <DropdownMenuItem className="gap-2">
                          <Rocket size={16} />
                          Changelog
                        </DropdownMenuItem>
                      </Link>

                      <Link href="mailto:contact@typper.io?subject=Support%20with%20Typper%20BI">
                        <DropdownMenuItem className="gap-2">
                          <LifeBuoy size={16} />
                          Support
                        </DropdownMenuItem>
                      </Link>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() =>
                          signOut({ redirect: true, callbackUrl: '/' })
                        }
                      >
                        <LogOut size={16} />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-full flex items-center justify-center">
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => setOpened(!opened)}
              >
                <ChevronsRight size={16} />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                <div className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 rounded-sm justify-center">
                  <Avatar className="w-8 h-8 rounded-sm items-center">
                    <AvatarImage
                      src={workspace?.avatar}
                      className="w-8 h-8 rounded-sm"
                    />
                    <AvatarFallback className="w-8 h-8 rounded-sm">
                      {workspaceAvatarFallback}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-[208px]">
                {workspaces.map((workspace, index) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    className="justify-between"
                    onClick={async () => {
                      await selectWorkspace(workspace.id)
                      window.location.reload()
                      localStorage.removeItem('setup')
                    }}
                  >
                    <p className="w-[70%] truncate">{workspace.name}</p>
                    <p className="text-muted-foreground text-xs">
                      ⌘{index + 1}
                    </p>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => {
                    setCreateWorkspaceDialogOpen(true)
                  }}
                >
                  <Plus size={16} />
                  Create workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator />

            <div className="flex flex-col gap-4 w-full justify-center items-center">
              <div
                className="bg-secondary/80 flex items-center rounded-md border-input border border-solid h-8 w-8 justify-center"
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handleCommandBarOpen()
                }}
              >
                <Search size={16} />
              </div>
            </div>

            <Separator />

            <div className="gap-4 flex flex-col justify-between h-full">
              <div className="gap-2 flex flex-col items-center">
                <MenuItem
                  opened={opened}
                  text="Chats"
                  icon={<Chat size={16} />}
                  route="/app/chat"
                />

                <MenuItem
                  opened={opened}
                  text="Dashboard"
                  icon={<LayoutDashboard size={16} />}
                  route="/app/dashboard"
                />

                <MenuItem
                  opened={opened}
                  text="Saved reports"
                  icon={<PieChart size={16} />}
                  route="/app/reports"
                />

                <MenuItem
                  opened={opened}
                  text="Query runner"
                  icon={<Code size={16} />}
                  route="/app/query"
                />

                <MenuItem
                  opened={opened}
                  text="Data sources"
                  icon={<Database size={16} />}
                  route="/app/data-source"
                />
              </div>

              <div className="flex flex-col gap-4">
                <Separator />

                <div className="flex gap-2 flex-col items-center">
                  <div className="flex flex-col gap-2">
                    <MenuItem
                      opened={opened}
                      text="Documentation"
                      icon={<BookOpen size={16} />}
                      route="https://docs.bi.typper.io"
                    />
                  </div>

                  <MenuItem
                    opened={opened}
                    text="Team"
                    icon={<Users size={16} />}
                    route="/app/team"
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <div className="h-10 w-10 flex items-center hover:bg-accent/50 rounded-md justify-center">
                        <Avatar className="w-4 h-4 shrink-0">
                          <AvatarImage src={user?.avatar} />
                          <AvatarFallback className="w-4 h-4">
                            {userAvatarFallback}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-[208px]">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="gap-2">
                          {theme === 'dark' ? (
                            <Moon size={16} />
                          ) : (
                            <Sun size={16} />
                          )}
                          Theme
                        </DropdownMenuSubTrigger>

                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => setTheme(systemTheme || 'light')}
                            >
                              <Sparkles size={16} /> System
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => setTheme('dark')}
                            >
                              <Moon size={16} /> Dark
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => setTheme('light')}
                            >
                              <Sun size={16} /> Light
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      <DropdownMenuSeparator />

                      <Link href="/app/data-source">
                        <DropdownMenuItem className="gap-2">
                          <Database size={16} />
                          Data sources
                        </DropdownMenuItem>
                      </Link>

                      <Link href="https://docs.bi.typper.io" target="_blank">
                        <DropdownMenuItem className="gap-2">
                          <BookOpen size={16} />
                          Documentation
                        </DropdownMenuItem>
                      </Link>

                      <Link
                        href="https://changelog.bi.typper.io"
                        target="_blank"
                      >
                        <DropdownMenuItem className="gap-2">
                          <Rocket size={16} />
                          Changelog
                        </DropdownMenuItem>
                      </Link>

                      <Link href="mailto:contact@typper.io?subject=Support%20with%20Typper%20BI">
                        <DropdownMenuItem className="gap-2">
                          <LifeBuoy size={16} />
                          Support
                        </DropdownMenuItem>
                      </Link>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => {
                          return signOut({ redirect: true, callbackUrl: '/' })
                        }}
                      >
                        <LogOut size={16} />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
