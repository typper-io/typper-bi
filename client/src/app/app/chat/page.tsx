/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { randomUUID } from 'crypto'

import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowDown,
  BarChart4Icon,
  BinaryIcon,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Edit2,
  File,
  LineChart,
  LineChartIcon,
  Loader2,
  MoreHorizontal,
  MoveDownIcon,
  Paperclip,
  PieChart,
  PieChartIcon,
  Plus,
  RefreshCcw,
  Send,
  SkipForward,
  TableIcon,
  Trash,
  X,
} from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import Fuse from 'fuse.js'

import _ from 'lodash'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'

import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/logo'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { CodeView } from '@/components/chat/code'
import { AudioMessage } from '@/components/audio-message'
import { ChangePhrase } from '@/components/change-phrase'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { toast } from 'sonner'

import { useAutoResizeTextArea } from '@/hooks/use-auto-resize-text-area'
import { MessageContent } from '@/app/app/chat/components/message-content'
import { Role, Thread } from '@/app/app/chat/interfaces/messages'
import { cn } from '@/lib/utils'
import { Tour } from '@/components/tour'
import { useAssistant } from '@/hooks/use-assistant'
import { useLocalStorage } from '@/hooks/use-localstorage'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type OnboardingTypes = null | 'chart' | 'analytics' | 'data' | 'report' | 'skip'

export default function Chat() {
  const searchParams = useSearchParams()

  const threadId = searchParams.get('threadId')

  const [openedThreads, setOpenedThreads] = useLocalStorage(
    'openedThreads',
    true
  )
  const [threads, setThreads] = useState<Array<[string, Array<Thread>]>>([])
  const [isNew, setIsNew] = useState(true)

  const [loadingThreads, setLoadingThreads] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchPattern, setSearchPattern] = useState('')
  const [searchResults, setSearchResults] = useState<
    Array<[string, Array<Thread>]>
  >([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedThread, setSelectedThread] = useState<Thread>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const inputFileRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<Array<File>>([])
  const [onboardingChat, setOnboardingChat] = useState<OnboardingTypes>(null)
  const [promptContext, setPromptContext] = useState<string>('')

  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    setMessages,
    sendMessage,
    setInput,
    input,
    status,
    setStatus,
  } = useAssistant({
    threadId,
    files,
    setFiles,
  })

  const handleSendMessage = useCallback(() => {
    if (onboardingChat) {
      setInput((input) => `${promptContext} displaying ${input}`)
      sendMessage(`${promptContext} displaying ${input}`)
      setOnboardingChat('skip')
      setPromptContext('')
      return
    }
    sendMessage()
  }, [promptContext, input, onboardingChat])

  const loading = useMemo(() => {
    return status !== 'awaiting_message'
  }, [status])

  useAutoResizeTextArea(textAreaRef.current, input, 210)

  const router = useRouter()

  const getThreads = useCallback(async () => {
    try {
      setLoadingThreads(true)

      const { data } = await api.get('/thread')

      const dates = Object.entries(data) as Array<[string, Array<Thread>]>

      setThreads(dates)

      setLoadingThreads(false)
    } catch (error) {
      setLoadingThreads(false)
    }
  }, [])

  const getMessages = useCallback(async () => {
    try {
      if (!threadId && !messages.length) {
        setIsNew(true)

        return
      }

      if (isNew) {
        return
      }

      setMessages([])

      if (!threadId) {
        return
      }

      setLoadingMessages(true)

      const { data } = await api.get(`/thread/${threadId}`)

      setMessages(data.messages)
      setLoadingMessages(false)
    } catch {
      setLoadingMessages(false)
    }
  }, [isNew, threadId, messages.length])

  useEffect(() => {
    getMessages()
  }, [threadId])

  useEffect(() => {
    getThreads()
  }, [getThreads, threadId, isNew])

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomOfList = useRef<boolean | null>(true)

  const [showScrollDownButton, setShowScrollDownButton] = useState(false)

  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [scrollRef.current])

  useEffect(() => {
    const scrollElement = scrollRef.current

    if (!scrollElement) return

    if (
      (bottomOfList.current =
        scrollElement.scrollHeight -
          scrollElement.scrollTop -
          scrollElement.clientHeight <
        50)
    ) {
      bottomOfList.current = true
      setShowScrollDownButton(false)
    }

    scrollElement.addEventListener('scroll', () => {
      const scrollElement = scrollRef.current

      if (!scrollElement) return

      const isAtBottom =
        scrollElement.scrollHeight -
          scrollElement.scrollTop -
          scrollElement.clientHeight <
        50

      bottomOfList.current = isAtBottom

      setShowScrollDownButton(!isAtBottom)
    })

    return () => scrollElement.removeEventListener('scroll', () => {})
  }, [scrollRef.current])

  useEffect(() => {
    if (bottomOfList.current) {
      scrollToBottom()
    }
  }, [messages, scrollRef.current, bottomOfList.current])

  const goToThread = useCallback(
    (threadId: string) => {
      setMessages([])
      setIsNew(false)
      setStatus('awaiting_message')
      bottomOfList.current = true
      setShowScrollDownButton(false)
      router.push(`/app/chat?threadId=${threadId}`)
    },
    [router]
  )

  const newThread = useCallback(() => {
    setPromptContext('')
    setOnboardingChat(null)
    setMessages([])
    setInput('')
    setIsNew(true)
    router.replace(`/app/chat`)
    bottomOfList.current = true
    setStatus('awaiting_message')
    setShowScrollDownButton(false)
  }, [router])

  const fuseSearch = useCallback(
    (pattern: string) => {
      const fuseOptions = {
        shouldSort: false,
        keys: ['1.title', '1.dataSource.name'],
      }

      const fuse = new Fuse(threads, fuseOptions)

      return fuse.search(pattern)
    },
    [threads]
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

  const handleConfirmRenameThread = useCallback(async () => {
    try {
      setLoadingEdit(true)

      await api.put(`/thread/${selectedThread?.id}`, {
        title: selectedThread?.title,
      })

      setEditDialogOpen(false)
      setLoadingEdit(false)
      toast('Chat renamed', {
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss(),
        },
      })
      getThreads()
    } catch (error) {
      setLoadingEdit(false)
    }
  }, [selectedThread])

  const handleConfirmDeleteThread = useCallback(async () => {
    try {
      setLoadingDelete(true)

      await api.delete(`/thread/${selectedThread?.id}`)

      setDeleteDialogOpen(false)
      setLoadingDelete(false)
      toast('Chat deleted', {
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss(),
        },
      })
      getThreads()
      newThread()
    } catch (error) {
      setLoadingDelete(false)
    }
  }, [selectedThread])

  return (
    <div className="flex h-full bg-accent/50 rounded-xl">
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete chat</DialogTitle>
            <DialogDescription>
              This chat will be deleted forever.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={loadingDelete}
            >
              Do not delete
            </Button>

            <Button
              variant="destructive"
              onClick={handleConfirmDeleteThread}
              disabled={loadingDelete}
              className="gap-2"
            >
              {loadingDelete && <Loader2 size={16} className="animate-spin" />}
              Delete chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
          </DialogHeader>
          <div className="flex w-full gap-4 items-center">
            <Label htmlFor="name" className="w-20 text-right">
              Name
            </Label>
            <Input
              id="name"
              defaultValue={selectedThread?.title}
              onChange={(event) => {
                setSelectedThread((thread) => ({
                  ...thread!,
                  title: event.target.value,
                }))
              }}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleConfirmRenameThread}
              disabled={loadingEdit}
              className="gap-2"
            >
              {loadingEdit && <Loader2 size={16} className="animate-spin" />}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tour
        id="chat-tour"
        steps={[
          {
            title: 'Select a data source',
            content:
              'Before asking any questions, you must first select the data source that will be used.',
            target: '#data-source-combobox',
            placement: 'left-start',
            disableBeacon: true,
          },
          {
            title: 'Ask a question',
            content:
              'You can write or send an audio to your assistant and he or she can answer everything.',
            target: '#input-message',
            placement: 'top-start',
          },
        ]}
      />

      <ResizablePanelGroup direction="horizontal">
        {openedThreads && (
          <ResizablePanel
            maxSize={40}
            minSize={15}
            defaultSize={15}
            className="h-full w-fit px-4 py-8 rounded-l-xl gap-4 flex flex-col"
          >
            <div className="flex flex-col gap-[10px] px-3">
              <Button
                variant="secondary"
                className="w-full flex gap-2"
                onClick={newThread}
              >
                <Plus size={16} />
                <p className="leading-5 text-sm">New Chat</p>
              </Button>
              <Input
                type="search"
                placeholder="Find chat"
                value={searchPattern}
                onChange={(event) => setSearchPattern(event.target.value)}
              />
            </div>

            <div className="px-3">
              <Separator className="bg-border" />
            </div>

            <div className="gap-4 flex flex-col overflow-y-auto">
              {loadingThreads && !threads.length && (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 20 }, randomUUID).map((skeleton) => (
                    <Skeleton key={skeleton} className="w-full h-8" />
                  ))}
                </div>
              )}

              {(searchPattern ? searchResults : threads).map(
                ([date, threads]) => (
                  <div key={date}>
                    <p className="text-xs px-3 leading-5 text-muted-foreground">
                      {date}
                    </p>
                    {threads.map((thread) => (
                      <div key={thread.id}>
                        <div
                          onClick={() => goToThread(thread.id)}
                          className={cn(
                            'cursor-pointer animate-thread h-fit items-center py-2 px-3 hover:bg-accent/50 rounded-md flex justify-between thread-item relative',
                            {
                              'bg-accent': thread.id === threadId,
                            }
                          )}
                        >
                          <div className="max-w-[100%] h-fit">
                            <p className="text-sm font-[500] truncate leading-6">
                              {thread.title}
                            </p>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger className="display-hidden absolute right-3 w-8 justify-end flex h-full items-center background-linear">
                              <MoreHorizontal size={16} />
                            </DropdownMenuTrigger>

                            <DropdownMenuContent>
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => {
                                  setSelectedThread(thread)
                                  setEditDialogOpen(true)
                                }}
                              >
                                <Edit2 size={16} />
                                Rename
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => {
                                  setSelectedThread(thread)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash size={16} />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </ResizablePanel>
        )}

        <ResizableHandle />

        <ResizablePanel
          defaultSize={75}
          minSize={50}
          className="h-full pt-8 w-full justify-between flex flex-col rounded-r-xl bg-accent/50 relative items-center"
        >
          <div className="absolute top-8 left-3 flex flex-col gap-2 z-10">
            <Button
              variant="ghost"
              className="h-8 min-w-8 w-8 p-0 shrink-0"
              onClick={() => setOpenedThreads((prev) => !prev)}
            >
              {openedThreads ? (
                <ChevronsLeft size={16} />
              ) : (
                <ChevronsRight size={16} />
              )}
            </Button>

            {!openedThreads && (
              <Button
                variant="ghost"
                className="h-8 min-w-8 w-8 p-0 shrink-0"
                onClick={newThread}
              >
                <Plus size={16} />
              </Button>
            )}
          </div>

          {loadingMessages ? (
            <div className="gap-8 flex flex-col overflow-y-scroll w-[80%] max-w-[900px]">
              {Array.from({ length: 5 }, randomUUID).map((skeleton) => (
                <Skeleton key={skeleton} className="w-full h-48" />
              ))}
            </div>
          ) : messages.length ? (
            <div
              id="message-container"
              ref={scrollRef}
              className="w-full items-center h-full max-h overflow-y-scroll relative flex flex-col"
            >
              {messages.map((message, index) => (
                <>
                  {message.role === Role.USER ? (
                    <div
                      key={message.id}
                      className="py-8 flex gap-4 w-[80%] max-w-[900px] justify-end"
                    >
                      <div className="w-fit bg-accent/50 rounded-lg px-6 py-4 flex flex-col gap-4 overflow-hidden">
                        {!!message.attachments?.length && (
                          <div className="flex gap-2 overflow-x-auto">
                            {message.attachments.map((attachment) => (
                              <div
                                key={attachment.filename}
                                className="p-2 flex items-center gap-2 bg-accent/50 rounded-md shrink-0"
                              >
                                <div className="h-8 w-8 flex items-center justify-center bg-accent">
                                  <File size={16} />
                                </div>

                                <p>{attachment.filename}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {message.content === 'audio_message' ? (
                          <AudioMessage />
                        ) : (
                          message.content && (
                            <Markdown
                              disallowedElements={['img']}
                              remarkPlugins={[remarkGfm]}
                              className="prose"
                              components={{
                                code(props) {
                                  const { children, className, node, ...rest } =
                                    props

                                  const match = /language-(\w+)/.exec(
                                    className || ''
                                  )

                                  return match ? (
                                    <CodeView language={match[1]}>
                                      {children}
                                    </CodeView>
                                  ) : (
                                    <code {...rest} className={className}>
                                      {children}
                                    </code>
                                  )
                                },
                                a: ({ children, href }) => (
                                  <Link href={href!} className="text-primary">
                                    {children}
                                  </Link>
                                ),
                                pre: ({ children }) => (
                                  <pre className="not-prose">{children}</pre>
                                ),
                              }}
                            >
                              {message.content}
                            </Markdown>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      key={message.id}
                      className={cn('py-8 flex gap-4 w-[80%] max-w-[900px]', {
                        'pt-2': messages[index - 1]?.role !== 'user',
                        'pb-2': messages[index + 1]?.role !== 'user',
                      })}
                    >
                      {message.content === 'error' ? (
                        <>
                          <div className="rounded-full bg-[#FACC15] w-8 h-8  p-2">
                            <AlertCircle size={16} color="#422006" />
                          </div>

                          <div className="flex flex-col gap-4">
                            <p>
                              Looks like something went wrong, please try again
                            </p>
                            <Button
                              className="w-fit gap-2"
                              onClick={() => {
                                const text = messages.find(
                                  ({ role }) => role === 'user'
                                )?.content!
                                sendMessage(text)
                              }}
                            >
                              <RefreshCcw size={16} />
                              Try again
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          {messages[index - 1]?.role !== 'user' ? (
                            <div className="h-8 aspect-square invisible" />
                          ) : (
                            <Logo size={32} />
                          )}

                          <div
                            id="markdown-message"
                            className="flex flex-col gap-4 w-full"
                          >
                            <MessageContent
                              assistantMessage={message}
                              disableAnimation={!isNew}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              ))}

              {loading && messages.at(-1)?.role === 'user' && (
                <>
                  <div className="py-8 flex gap-4 w-[80%] max-w-[900px]">
                    <Skeleton className="w-8 h-8 aspect-square rounded-full shrink-0" />

                    <div className="flex-col gap-4 flex w-full">
                      <Skeleton className="w-full h-12" />

                      <Skeleton className="w-1/3 h-12" />

                      <Skeleton className="w-1/2 h-12" />
                    </div>
                  </div>
                </>
              )}

              {showScrollDownButton && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="sticky bottom-4 scroll-down-shadow right-1/2 left-1/2 shrink-0"
                  onClick={scrollToBottom}
                >
                  <ArrowDown size={16} />
                </Button>
              )}
            </div>
          ) : (
            <ChatOnboarding
              onboardingChat={onboardingChat}
              setOnboardingChat={setOnboardingChat}
              setPromptContext={setPromptContext}
            />
          )}

          <div className="py-8 border-t border-t-border z-10 w-full flex justify-center">
            <div className="flex gap-4 items-end w-[80%] max-w-[900px]">
              <div className="w-full flex gap-1 items-end">
                <Button
                  variant="ghost"
                  onClick={() => inputFileRef.current?.click()}
                >
                  <input
                    accept=".c,.cs,.cpp,.doc,.docx,.html,.java,.json,.md,.pdf,.php,.pptx,.py,.rb,.tex,.txt,.css,.js,.sh,.ts"
                    type="file"
                    className="hidden"
                    ref={inputFileRef}
                    multiple
                    onChange={(event) => {
                      setFiles((files) => {
                        return [
                          ...files,
                          ...Array.from(event.target.files || []),
                        ]
                      })
                    }}
                  />
                  <Paperclip size={16} />
                </Button>

                <div
                  className={cn(
                    'flex flex-col gap-4 w-full rounded-md border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    {
                      'px-3 py-2': files.length,
                    }
                  )}
                >
                  {!!files.length && (
                    <div className="flex gap-2 overflow-x-auto">
                      {files.map((file) => (
                        <div
                          key={file.name}
                          className="p-2 flex items-center gap-2 bg-accent/50 rounded-md shrink-0"
                        >
                          <div className="h-8 w-8 flex items-center justify-center bg-accent">
                            <File size={16} />
                          </div>

                          <p>{file.name}</p>

                          <Button
                            variant="ghost"
                            onClick={() => {
                              setFiles((files) => {
                                return files.filter((f) => f.name !== file.name)
                              })
                            }}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Textarea
                    id="input-message"
                    placeholder="Chart about..."
                    className="resize-none min-h-10 bg-none border-none focus-visible:ring-offset-0 focus-visible:ring-0"
                    value={input}
                    ref={textAreaRef}
                    style={{
                      height: '40px',
                      overflowY: 'hidden',
                    }}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' &&
                        !event.shiftKey &&
                        !event.ctrlKey &&
                        !event.altKey
                      ) {
                        event.preventDefault()
                        event.stopPropagation()
                        handleSendMessage()
                      }
                    }}
                    autoFocus
                  />
                </div>
              </div>

              <Button onClick={handleSendMessage} disabled={loading}>
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

function ChatOnboarding({
  onboardingChat,
  setOnboardingChat,
  setPromptContext,
}: {
  onboardingChat: OnboardingTypes
  setOnboardingChat: (value: OnboardingTypes) => void

  setPromptContext: (value: string) => void
}) {
  const phrases = ['SQL queries', 'analyses', 'reports', 'charts']

  const questions: Record<string, ReactElement | null> = {
    chart: <ChartOnboarding setPromptContext={setPromptContext} />,
    skip: (
      <div className="gap-2 flex flex-col items-center justify-center">
        <Logo size={64} />

        <p className="text-base leading-7">
          I can help you create <ChangePhrase phrases={phrases} />
        </p>
      </div>
    ),
    analytics: <AnalyticsOnboarding setPromptContext={setPromptContext} />,
    data: <AskAboutDataOnboarding setPromptContext={setPromptContext} />,
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-16 w-full">
      {!onboardingChat ? (
        <>
          <div className="gap-2 flex flex-col items-center justify-center">
            <Logo size={64} />

            <p className="text-base leading-7">
              I can help you create <ChangePhrase phrases={phrases} />
            </p>
          </div>

          <div className="flex flex-col gap-8 w-[80%] max-w-[900px]">
            <div className="flex gap-8 w-full">
              <Button
                onClick={() => setOnboardingChat('chart')}
                className="bg-accent/50 p-6 gap-2 flex flex-col justify-center w-full hover:bg-accent disabled:opacity-5 cursor-pointer rounded-lg h-fit items-start text-accent-foreground"
              >
                <PieChart size={24} color="#95F31F" />
                <p className="text-lg font-bold">Create chart</p>
              </Button>

              <Button
                onClick={() => setOnboardingChat('analytics')}
                className="bg-accent/50 p-6 gap-2 flex flex-col justify-center w-full hover:bg-accent disabled:opacity-5 cursor-pointer rounded-lg h-fit items-start text-accent-foreground"
              >
                <LineChart size={24} color="#FFABC7" />
                <p className="text-lg font-bold">Analytics</p>
              </Button>
            </div>

            <div className="flex gap-8 w-full">
              <Button
                onClick={() => setOnboardingChat('data')}
                className="bg-accent/50 p-6 gap-2 flex flex-col justify-center w-full hover:bg-accent disabled:opacity-5 cursor-pointer rounded-lg h-fit items-start text-accent-foreground"
              >
                <Database size={24} color="#0047FD" />
                <p className="text-lg font-bold">Ask about data</p>
              </Button>

              <Button
                className="bg-accent/50 p-6 gap-2 flex flex-col justify-center w-full hover:bg-accent disabled:opacity-5 cursor-pointer rounded-lg h-fit items-start text-accent-foreground"
                onClick={() => setOnboardingChat('skip')}
              >
                <SkipForward size={24} />
                <p className="text-lg font-bold">Skip assistance</p>
              </Button>
            </div>
          </div>
        </>
      ) : (
        questions[onboardingChat]
      )}
    </div>
  )
}

const ChartOnboarding = ({
  setPromptContext,
}: {
  setPromptContext: (value: string) => void
}) => {
  const [chartOptions, setChartOptions] = useState({
    type: '',
    timePeriod: '',
    segmentation: '',
  })

  useEffect(() => {
    let prompt = 'I need a chart\n'

    if (chartOptions.type) {
      prompt += `of type ${chartOptions.type},\n`
    }
    if (chartOptions.timePeriod) {
      prompt += `for the ${chartOptions.timePeriod} period,\n`
    }
    if (chartOptions.segmentation) {
      prompt += `segmented by ${chartOptions.segmentation}\n`
    }

    setPromptContext(prompt)
  }, [chartOptions])

  return (
    <div className="w-full items-center h-full max-h overflow-y-scroll relative flex flex-col">
      <div className="py-8 flex gap-4 w-[80%] max-w-[900px]">
        <div className="flex gap-4 py-8 text-base leading-7">
          <Logo size={32} />
          <div className="flex flex-col gap-8">
            <p>
              To create the chart, I&apos;ll need you to answer a few questions.
            </p>
            <div className="flex flex-col gap-4">
              <p>1. What type of chart would you like to create?</p>

              <ToggleGroup
                type="single"
                onValueChange={(value) =>
                  setChartOptions((options) => ({ ...options, type: value }))
                }
              >
                <ToggleGroupItem className="flex gap-2" value="table">
                  <TableIcon size={16} />
                  Table
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="bar">
                  <BarChart4Icon size={16} />
                  Bar
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="line">
                  <LineChartIcon size={16} />
                  Line
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="pie">
                  <PieChartIcon size={16} />
                  Pie
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="number">
                  <BinaryIcon size={16} />
                  Number
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-4">
              <p>2. What time period would you like to analyze?</p>

              <ToggleGroup
                type="single"
                onValueChange={(value) =>
                  setChartOptions((chartOptions) => ({
                    ...chartOptions,
                    timePeriod: value,
                  }))
                }
              >
                <ToggleGroupItem className="flex gap-2" value="last week">
                  Last week
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="last month">
                  Last month
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="last year">
                  Last year
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="last quarter">
                  Last quarter
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="all time">
                  All time
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-4">
              <p>
                3. Are there any segmentation or grouping you want to apply?
              </p>

              <ToggleGroup
                type="single"
                onValueChange={(value) =>
                  setChartOptions((chartOptions) => ({
                    ...chartOptions,
                    segmentation: value,
                  }))
                }
              >
                <ToggleGroupItem className="flex gap-2" value="region">
                  By region
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="quarter">
                  By quarter
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="category">
                  By category
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="product">
                  By product
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-4">
              <p>4. What do you want the chart to show?</p>
              <div className="flex gap-1 items-center">
                Insert in the input below <MoveDownIcon size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const AnalyticsOnboarding = ({
  setPromptContext,
}: {
  setPromptContext: (value: string) => void
}) => {
  const [analyticsOptions, setAnalyticsOptions] = useState({
    comparison: '',
    timePeriod: '',
    levelOfDetail: '',
  })

  useEffect(() => {
    let prompt = 'I need a analysis\n'

    if (analyticsOptions.timePeriod) {
      prompt += `for the ${analyticsOptions.timePeriod} period,\n`
    }
    if (analyticsOptions.comparison !== 'no' && analyticsOptions.comparison) {
      prompt += `comparing with the ${analyticsOptions.comparison} period\n`
    }
    if (analyticsOptions.levelOfDetail) {
      prompt += `with a ${analyticsOptions.levelOfDetail} level of detail\n`
    }

    setPromptContext(prompt)
  }, [analyticsOptions])

  return (
    <div className="w-full items-center h-full max-h overflow-y-scroll relative flex flex-col">
      <div className="py-8 flex gap-4 w-[80%] max-w-[900px]">
        <div className="flex gap-4 py-8 text-base leading-7">
          <Logo size={32} />
          <div className="flex flex-col gap-8">
            <p>
              To create the analyses, I&apos;ll need you to answer a few
              questions.
            </p>

            <div className="flex flex-col gap-4">
              <p>1. What time period would you like to analyze?</p>

              <ToggleGroup
                type="single"
                onValueChange={(value) =>
                  setAnalyticsOptions((analyticsOptions) => ({
                    ...analyticsOptions,
                    timePeriod: value,
                  }))
                }
              >
                <ToggleGroupItem className="flex gap-2" value="last week">
                  Last week
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="last month">
                  Last month
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="last year">
                  Last year
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="last quarter">
                  Last quarter
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="all time">
                  All time
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-4">
              <p>2. Compare data with others periods? (If possible)</p>

              <ToggleGroup
                type="single"
                onValueChange={(value) =>
                  setAnalyticsOptions((analyticsOptions) => ({
                    ...analyticsOptions,
                    comparison: value,
                  }))
                }
              >
                <ToggleGroupItem className="flex gap-2" value="no">
                  No
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="previous">
                  With the previous
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="all">
                  With all
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-4">
              <p>3. What level of detail do you need in the analysis??</p>
              <ToggleGroup
                type="single"
                onValueChange={(value) =>
                  setAnalyticsOptions((analyticsOptions) => ({
                    ...analyticsOptions,
                    levelOfDetail: value,
                  }))
                }
              >
                <ToggleGroupItem className="flex gap-2" value="summary">
                  Summary
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="detailed">
                  Detailed
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-4">
              <p>4. Please describe in details what you want to analyze.</p>
              <div className="flex gap-1 items-center">
                Insert in the input below <MoveDownIcon size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const AskAboutDataOnboarding = ({
  setPromptContext,
}: {
  setPromptContext: (value: string) => void
}) => {
  const [askAboutDataOptions, setAskAboutDataOptions] = useState({
    type: '',
  })

  useEffect(() => {
    let prompt = 'I want to ask about\n'

    if (askAboutDataOptions.type) {
      prompt += `${askAboutDataOptions.type}\n`
    }

    setPromptContext(prompt)
  }, [askAboutDataOptions])

  return (
    <div className="w-full items-center h-full max-h overflow-y-scroll relative flex flex-col">
      <div className="py-8 flex gap-4 w-[80%] max-w-[900px]">
        <div className="flex gap-4 py-8 text-base leading-7">
          <Logo size={32} />
          <div className="flex flex-col gap-8">
            <p>
              To know more about your data, I&apos;ll need you to answer a few
              questions.
            </p>

            <div className="flex flex-col gap-4">
              <p>1. What time period would you like to analyze?</p>

              <ToggleGroup
                type="single"
                onValueChange={(value) =>
                  setAskAboutDataOptions((analyticsOptions) => ({
                    ...analyticsOptions,
                    type: value,
                  }))
                }
              >
                <ToggleGroupItem className="flex gap-2" value="data">
                  About data
                </ToggleGroupItem>
                <ToggleGroupItem className="flex gap-2" value="data sources">
                  About data sources
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {askAboutDataOptions.type === 'data sources' && (
              <div className="flex flex-col gap-4">
                <p>2. Specify the data source you want to inquire about..</p>
                <div className="flex gap-1 items-center">
                  Insert in the input below <MoveDownIcon size={16} />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <p>3. Please describe in details what you want to know..</p>
              <div className="flex gap-1 items-center">
                Insert in the input below <MoveDownIcon size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
