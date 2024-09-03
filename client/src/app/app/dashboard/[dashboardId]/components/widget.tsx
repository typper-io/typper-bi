import {
  MoreVertical,
  Edit2,
  PieChartIcon,
  BarChart4Icon,
  LineChartIcon,
  BinaryIcon,
  MinusCircle,
} from 'lucide-react'
import { Dispatch, SetStateAction, useCallback, useState } from 'react'

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
import { Button } from '@/components/ui/button'
import { RenderWidget } from '@/app/app/dashboard/[dashboardId]/components/render-widget'
import { cn } from '@/lib/utils'

interface WidgetProps {
  editing: boolean
  setSelectedReport: Dispatch<
    SetStateAction<{
      content: string
      type: 'markdown' | 'report'
      name: string
      layout: {
        i: string
        x: number
        y: number
        w: number
        h: number
        minW?: number
        minH?: number
      }
    } | null>
  >
  item: {
    content: string
    name: string
    type: 'markdown' | 'report'
    layout: {
      i: string
      x: number
      y: number
      w: number
      h: number
    }
  }
  setEditingReportNameDialogOpen: Dispatch<SetStateAction<boolean>>
  setRemovingReportDialogOpen: Dispatch<SetStateAction<boolean>>
  setWidgets: Dispatch<
    SetStateAction<
      {
        content: string
        type: 'markdown' | 'report'
        name: string
        layout: {
          i: string
          x: number
          y: number
          w: number
          h: number
          minW?: number
          minH?: number
        }
      }[]
    >
  >
}

export function Widget({
  editing,
  setSelectedReport,
  item,
  setEditingReportNameDialogOpen,
  setRemovingReportDialogOpen,
  setWidgets,
}: WidgetProps) {
  const [currentReportType, setCurrentReportType] = useState<
    string | undefined
  >()
  const [loadingReportUpdate, setLoadingReportUpdate] = useState<boolean>(false)

  const handleUpdateReportDisplay = useCallback(
    async ({ reportId, display }: { reportId: string; display: string }) => {
      setLoadingReportUpdate(true)
      const { data } = await api.put(`/report/${reportId}`, {
        display,
      })

      setCurrentReportType(data.display)
      setTimeout(() => {
        setLoadingReportUpdate(false)
      }, 500)
    },
    []
  )

  return (
    <>
      {item.type !== 'markdown' && (
        <div className="flex gap-2 py-1 px-4 items-center justify-between">
          <p className="truncate">{item.name}</p>

          {editing && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => {
                    setSelectedReport(item)
                    setEditingReportNameDialogOpen(true)
                  }}
                >
                  <Edit2 size={16} />
                  Rename
                </DropdownMenuItem>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2">
                    <PieChartIcon size={16} /> Change type
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => {
                          handleUpdateReportDisplay({
                            reportId: item.layout.i,
                            display: 'table',
                          })
                        }}
                      >
                        <PieChartIcon size={16} /> Table
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => {
                          handleUpdateReportDisplay({
                            reportId: item.layout.i,
                            display: 'bar',
                          })
                        }}
                      >
                        <BarChart4Icon size={16} /> Bar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => {
                          handleUpdateReportDisplay({
                            reportId: item.layout.i,
                            display: 'line',
                          })
                        }}
                      >
                        <LineChartIcon size={16} /> Line
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => {
                          handleUpdateReportDisplay({
                            reportId: item.layout.i,
                            display: 'pie',
                          })
                        }}
                      >
                        <PieChartIcon size={16} /> Pie
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => {
                          handleUpdateReportDisplay({
                            reportId: item.layout.i,
                            display: 'number',
                          })
                        }}
                      >
                        <BinaryIcon size={16} /> Number
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => {
                    setSelectedReport(item)
                    setRemovingReportDialogOpen(true)
                  }}
                >
                  <MinusCircle size={16} />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <div
        className={cn(
          'w-full h-full py-2 px-3 overflow-auto flex items-start',
          {
            'remove-child-bg remove-child-border': item.type !== 'markdown',
          }
        )}
      >
        <RenderWidget
          key={item.layout.i}
          content={item.content}
          type={item.type}
          editing={editing}
          display={currentReportType}
          loadingReportUpdate={loadingReportUpdate}
          onChangeContent={(content) => {
            setWidgets((oldWidgets) => {
              return oldWidgets.map((widget) => {
                if (widget.layout.i === item.layout.i) {
                  return { ...widget, content }
                }

                return widget
              })
            })
          }}
        />

        {editing && item.type === 'markdown' && (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => {
                  setSelectedReport(item)
                  setRemovingReportDialogOpen(true)
                }}
              >
                <MinusCircle size={16} />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </>
  )
}
