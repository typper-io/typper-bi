'use client'

import { Check, Edit2, Text, Plus, Loader2, ArrowLeft } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'

import { Widget } from '@/app/app/dashboard/[dashboardId]/components/widget'
import { AddReportCombobox } from '@/components/add-report-combobox'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { widConfig } from '@/constants/widget-configurations'
import { api } from '@/services/api'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { cn } from '@/lib/utils'

const ResponsiveGridLayout = WidthProvider(Responsive)

const Handle = React.forwardRef<
  HTMLInputElement,
  { handleAxis?: string; editing: boolean }
>((props, ref) => {
  const { editing, handleAxis, ...restProps } = props

  if (!editing) return null

  if (['ne', 'nw', 'se', 'sw'].includes(handleAxis || '')) {
    return (
      <div
        ref={ref}
        {...restProps}
        className={cn(
          `react-resizable-handle react-resizable-handle-${handleAxis}`
        )}
      />
    )
  }

  return (
    <div
      ref={ref}
      {...restProps}
      className={cn(
        `handle react-resizable-handle react-resizable-handle-${handleAxis}`,
        {
          '!left-[-4px]': handleAxis === 'w',
          '!top-[-4px]': handleAxis === 'n',
          '!right-[-4px]': handleAxis === 'e',
          '!bottom-[-4px]': handleAxis === 's',
        }
      )}
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="hidden dark:block"
      >
        <g clipPath="url(#clip0_4250_44276)">
          <path
            d="M14.1429 2.82843C12.5808 1.26633 10.0481 1.26633 8.48603 2.82843L2.82917 8.48528C1.26707 10.0474 1.26707 12.58 2.82917 14.1421L5.6576 16.9706C7.2197 18.5327 9.75236 18.5327 11.3145 16.9706L16.9713 11.3137C18.5334 9.75161 18.5334 7.21895 16.9713 5.65685L14.1429 2.82843Z"
            fill="#1E293B"
          />
          <path
            d="M11.668 6.01078C11.4727 5.81552 11.1562 5.81552 10.9609 6.01078C10.7656 6.20604 10.7656 6.52262 10.9609 6.71789C11.1562 6.91315 11.4727 6.91315 11.668 6.71789C11.8633 6.52262 11.8633 6.20604 11.668 6.01078Z"
            fill="#F8FAFC"
          />
          <path
            d="M9.54691 8.13187C9.35165 7.93661 9.03507 7.93661 8.83981 8.13187C8.64454 8.32714 8.64454 8.64372 8.83981 8.83898C9.03507 9.03424 9.35165 9.03424 9.54691 8.83898C9.74217 8.64372 9.74217 8.32714 9.54691 8.13187Z"
            fill="#F8FAFC"
          />
          <path
            d="M7.42582 10.253C7.23056 10.0577 6.91397 10.0577 6.71871 10.253C6.52345 10.4482 6.52345 10.7648 6.71871 10.9601C6.91397 11.1553 7.23056 11.1553 7.42582 10.9601C7.62108 10.7648 7.62108 10.4482 7.42582 10.253Z"
            fill="#F8FAFC"
          />
          <path
            d="M13.7891 8.13187C13.5938 7.93661 13.2773 7.93661 13.082 8.13187C12.8867 8.32714 12.8867 8.64372 13.082 8.83898C13.2773 9.03424 13.5938 9.03424 13.7891 8.83898C13.9844 8.64372 13.9844 8.32714 13.7891 8.13187Z"
            fill="#F8FAFC"
          />
          <path
            d="M11.668 10.253C11.4727 10.0577 11.1562 10.0577 10.9609 10.253C10.7656 10.4482 10.7656 10.7648 10.9609 10.9601C11.1562 11.1553 11.4727 11.1553 11.668 10.9601C11.8633 10.7648 11.8633 10.4482 11.668 10.253Z"
            fill="#F8FAFC"
          />
          <path
            d="M9.54691 12.375C9.35165 12.1798 9.03507 12.1798 8.83981 12.375C8.64454 12.5703 8.64454 12.8869 8.83981 13.0821C9.03507 13.2774 9.35165 13.2774 9.54691 13.0821C9.74217 12.8869 9.74217 12.5703 9.54691 12.375Z"
            fill="#F8FAFC"
          />
        </g>
        <defs>
          <clipPath id="clip0_4250_44276">
            <path
              d="M14.1429 2.82843C12.5808 1.26633 10.0481 1.26633 8.48603 2.82843L2.82917 8.48528C1.26707 10.0474 1.26707 12.58 2.82917 14.1421L5.6576 16.9706C7.2197 18.5327 9.75236 18.5327 11.3145 16.9706L16.9713 11.3137C18.5334 9.75161 18.5334 7.21895 16.9713 5.65685L14.1429 2.82843Z"
              fill="white"
            />
          </clipPath>
        </defs>
      </svg>

      <svg
        width="30"
        height="30"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block dark:hidden"
      >
        <g clipPath="url(#clip0_4250_44276)">
          <path
            d="M14.1429 2.82843C12.5808 1.26633 10.0481 1.26633 8.48603 2.82843L2.82917 8.48528C1.26707 10.0474 1.26707 12.58 2.82917 14.1421L5.6576 16.9706C7.2197 18.5327 9.75236 18.5327 11.3145 16.9706L16.9713 11.3137C18.5334 9.75161 18.5334 7.21895 16.9713 5.65685L14.1429 2.82843Z"
            fill="#F1F5F9"
          />
          <path
            d="M11.668 6.01078C11.4727 5.81552 11.1562 5.81552 10.9609 6.01078C10.7656 6.20604 10.7656 6.52262 10.9609 6.71789C11.1562 6.91315 11.4727 6.91315 11.668 6.71789C11.8633 6.52262 11.8633 6.20604 11.668 6.01078Z"
            fill="#020817"
          />
          <path
            d="M9.54691 8.13187C9.35165 7.93661 9.03507 7.93661 8.83981 8.13187C8.64454 8.32714 8.64454 8.64372 8.83981 8.83898C9.03507 9.03424 9.35165 9.03424 9.54691 8.83898C9.74217 8.64372 9.74217 8.32714 9.54691 8.13187Z"
            fill="#020817"
          />
          <path
            d="M7.42582 10.253C7.23056 10.0577 6.91397 10.0577 6.71871 10.253C6.52345 10.4482 6.52345 10.7648 6.71871 10.9601C6.91397 11.1553 7.23056 11.1553 7.42582 10.9601C7.62108 10.7648 7.62108 10.4482 7.42582 10.253Z"
            fill="#020817"
          />
          <path
            d="M13.7891 8.13187C13.5938 7.93661 13.2773 7.93661 13.082 8.13187C12.8867 8.32714 12.8867 8.64372 13.082 8.83898C13.2773 9.03424 13.5938 9.03424 13.7891 8.83898C13.9844 8.64372 13.9844 8.32714 13.7891 8.13187Z"
            fill="#020817"
          />
          <path
            d="M11.668 10.253C11.4727 10.0577 11.1562 10.0577 10.9609 10.253C10.7656 10.4482 10.7656 10.7648 10.9609 10.9601C11.1562 11.1553 11.4727 11.1553 11.668 10.9601C11.8633 10.7648 11.8633 10.4482 11.668 10.253Z"
            fill="#020817"
          />
          <path
            d="M9.54691 12.375C9.35165 12.1798 9.03507 12.1798 8.83981 12.375C8.64454 12.5703 8.64454 12.8869 8.83981 13.0821C9.03507 13.2774 9.35165 13.2774 9.54691 13.0821C9.74217 12.8869 9.74217 12.5703 9.54691 12.375Z"
            fill="#020817"
          />
        </g>
        <defs>
          <clipPath id="clip0_4250_44276">
            <path
              d="M14.1429 2.82843C12.5808 1.26633 10.0481 1.26633 8.48603 2.82843L2.82917 8.48528C1.26707 10.0474 1.26707 12.58 2.82917 14.1421L5.6576 16.9706C7.2197 18.5327 9.75236 18.5327 11.3145 16.9706L16.9713 11.3137C18.5334 9.75161 18.5334 7.21895 16.9713 5.65685L14.1429 2.82843Z"
              fill="white"
            />
          </clipPath>
        </defs>
      </svg>
    </div>
  )
})

Handle.displayName = 'Handle'

export default function DashboardPage() {
  const [originalLayout, setOriginalLayout] = useState<
    Array<{
      i: string
      x: number
      y: number
      w: number
      h: number
      minW?: number
      minH?: number
    }>
  >([])
  const [widgets, setWidgets] = useState<
    Array<{
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
    }>
  >([])
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dashboardName, setDashboardName] = useState('')
  const [editing, setEditing] = useState(false)
  const [reports, setReports] = useState([])
  const [loadingSaveChanges, setLoadingSaveChanges] = useState(false)
  const [editingReportNameDialogOpen, setEditingReportNameDialogOpen] =
    useState(false)
  const [removingReportDialogOpen, setRemovingWidgetDialogOpen] =
    useState(false)
  const [selectedReport, setSelectedReport] = useState<{
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
  } | null>(null)

  const { dashboardId } = useParams()

  useEffect(() => {
    if (!editing) {
      window.onbeforeunload = null

      return
    }

    window.onbeforeunload = function () {
      return 'Are you sure you want to leave?'
    }

    return () => {
      window.onbeforeunload = null
    }
  }, [editing])

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)

      const { data } = await api.get(`/dashboard/${dashboardId}`)

      const dataWidgets = data.widgets && JSON.parse(data.widgets)

      setOriginalLayout(
        dataWidgets?.map(
          (widget: {
            layout: {
              i: string
              x: number
              y: number
              w: number
              h: number
            }
            type: 'markdown' | 'report'
          }) => ({
            i: widget.layout.i,
            x: widget.layout.x,
            y: widget.layout.y,
            w: widget.layout.w,
            h: widget.layout.h,
            minH:
              widget.type == 'markdown'
                ? widConfig.markdown.minHeight
                : widConfig.report.minHeight,
            minW:
              widget.type == 'markdown'
                ? widConfig.markdown.minWidth
                : widConfig.report.minWidth,
            static: true,
          })
        ) || []
      )
      setDashboardName(data.name)
      setWidgets(dataWidgets || [])
      setLoading(false)

      if (!dataWidgets) {
        setEditing(true)
      }
    }

    const fetchReports = async () => {
      const { data } = await api.get('/report')

      setReports(data)
    }

    fetchDashboard()
    fetchReports()
  }, [dashboardId])

  const handleStartEditing = useCallback(() => {
    setEditing(true)
    setOriginalLayout((oldLayouts) => {
      return oldLayouts.map((layout) => ({
        ...layout,
        static: false,
      }))
    })
  }, [])

  const handleAddReport = useCallback(
    (reportId: string) => {
      setWidgets((oldWidgets) => {
        if (oldWidgets.find((widget) => widget.content === reportId)) {
          return oldWidgets
        }

        return [
          ...oldWidgets,
          {
            content: reportId,
            layout: {
              i: reportId,
              x: 0,
              y: 0,
              w: 13,
              h: 2,
              minH: widConfig.report.minHeight,
              minW: widConfig.report.minWidth,
            },
            name:
              (
                reports.find(
                  (report: { id: string }) => report.id === reportId
                ) as any
              )?.name || '',
            type: 'report',
          },
        ]
      })
      setOriginalLayout((oldLayouts) => {
        if (oldLayouts.find((layout) => layout.i === reportId)) {
          return oldLayouts
        }

        return [
          ...oldLayouts,
          {
            i: reportId,
            x: 0,
            y: 0,
            w: 13,
            h: 2,
            minH: widConfig.report.minHeight,
            minW: widConfig.report.minWidth,
            static: false,
          },
        ]
      })
    },
    [reports]
  )

  const handleAddMarkdown = useCallback(() => {
    setWidgets((oldWidgets) => {
      return [
        ...oldWidgets,
        {
          content: '# Insert you text here',
          layout: {
            i: `${Date.now()}`,
            x: 0,
            y: 0,
            w: 13,
            h: 1,
            minH: widConfig.markdown.minHeight,
            minW: widConfig.markdown.minWidth,
          },
          name: '',
          type: 'markdown',
        },
      ]
    })
    setOriginalLayout((oldLayouts) => {
      return [
        ...oldLayouts,
        {
          i: `${Date.now()}`,
          x: 0,
          y: 0,
          w: 13,
          h: 1,
          minH: widConfig.markdown.minHeight,
          minW: widConfig.markdown.minWidth,
          static: false,
        },
      ]
    })
  }, [])

  const handleSaveChanges = useCallback(async () => {
    setLoadingSaveChanges(true)

    await api.put(`/dashboard/${dashboardId}`, {
      name: dashboardName,
      widgets: widgets,
    })

    setEditing(false)
    setLoadingSaveChanges(false)
    setOriginalLayout((oldLayouts) => {
      return oldLayouts.map((layout) => ({
        ...layout,
        static: true,
      }))
    })
  }, [dashboardId, dashboardName, widgets])

  const handleRenameReport = useCallback(() => {
    setWidgets((oldWidgets) => {
      return oldWidgets.map((widget) => {
        if (widget.layout.i === selectedReport?.layout.i) {
          return {
            ...widget,
            name: selectedReport?.name || '',
          }
        }

        return widget
      })
    })
    setEditingReportNameDialogOpen(false)
  }, [selectedReport?.layout.i, selectedReport?.name])

  const handleRemoveWidget = useCallback(() => {
    setWidgets((oldWidgets) => {
      return oldWidgets.filter(
        (widget) => widget.layout.i !== selectedReport?.layout.i
      )
    })
    setRemovingWidgetDialogOpen(false)
  }, [selectedReport?.layout.i])

  return (
    <div className="bg-accent/50 h-full max-w-full w-full p-8 rounded-xl gap-8 flex flex-col overflow-y-auto">
      <div className="w-full flex justify-between items-center">
        {loading ? (
          <Skeleton className="h-9 w-40" />
        ) : (
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              className="bg-transparent w-8 h-8"
              onClick={() => router.back()}
              size="icon"
            >
              <ArrowLeft size={16} />
            </Button>
            <p className="font-semibold text-3xl leading-9">{dashboardName}</p>
          </div>
        )}
        <div className="flex gap-4 items-center">
          {editing && (
            <>
              <AddReportCombobox
                data={reports.map((report: { id: string; name: string }) => ({
                  label: report.name,
                  value: report.id,
                }))}
                value=""
                disabled={loadingSaveChanges}
                icon={<Plus size={16} />}
                emptyLabel="Add report"
                placeholder="Add report"
                setValue={(value: string) => {
                  handleAddReport(value)
                }}
              />
              <Button
                variant="secondary"
                className="gap-2"
                disabled={loadingSaveChanges}
                onClick={handleAddMarkdown}
              >
                <Text size={16} />
                Add text
              </Button>
            </>
          )}
          <Button
            variant={editing ? 'default' : 'outline'}
            className={cn('gap-2 bg-transparent', editing && 'bg-primary')}
            onClick={editing ? handleSaveChanges : handleStartEditing}
            disabled={loading || loadingSaveChanges}
          >
            {editing ? (
              <>
                {loadingSaveChanges ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Save changes
              </>
            ) : (
              <>
                <Edit2 size={16} />
                Edit dashboard
              </>
            )}
          </Button>
        </div>
      </div>

      <Dialog
        open={editingReportNameDialogOpen}
        onOpenChange={setEditingReportNameDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename report</DialogTitle>
            <DialogDescription>
              The report name will be changed only in this dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex w-full gap-4 items-center">
            <Label htmlFor="link" className="w-36 text-right truncate">
              Report name
            </Label>
            <Input
              id="link"
              defaultValue={selectedReport?.name}
              onChange={(event) => {
                setSelectedReport((oldReport) => {
                  if (!oldReport) return null

                  return {
                    ...oldReport,
                    name: event.target.value,
                  }
                })
              }}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleRenameReport} className="gap-2">
              Save report name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={removingReportDialogOpen}
        onOpenChange={setRemovingWidgetDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove widget from dashboard</DialogTitle>
            <DialogDescription>
              The reports will still be saved in &quot;All reports&quot;.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemovingWidgetDialogOpen(false)}
            >
              Do not remove
            </Button>

            <Button variant="outline" onClick={handleRemoveWidget}>
              Remove widget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-accent/50 rounded-xl max-w-full w-full h-full p-4 overflow-auto">
        {!widgets.length ? (
          <div className="flex flex-col gap-4">
            <p className="text-base leading-7">
              Add the first report or text to start the dashboard.
            </p>
            <div className="gap-4 flex items-center">
              <AddReportCombobox
                data={reports.map((report: { id: string; name: string }) => ({
                  label: report.name,
                  value: report.id,
                }))}
                value=""
                disabled={loadingSaveChanges}
                icon={<Plus size={16} />}
                emptyLabel="Add first report"
                placeholder="Add first report"
                setValue={(value: string) => {
                  handleAddReport(value)
                }}
              />

              <Button
                variant="secondary"
                className="gap-2"
                onClick={handleAddMarkdown}
              >
                <Text size={16} />
                Add text
              </Button>
            </div>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            resizeHandles={['s', 'e', 'w', 'n', 'ne', 'nw', 'sw', 'se']}
            resizeHandle={<Handle editing={editing} />}
            onLayoutChange={(layout) => {
              setWidgets((oldWidgets) => {
                return oldWidgets.map((widget) => {
                  const newLayout = layout.find(
                    (item) => item.i === widget.layout.i
                  )
                  if (newLayout) {
                    return {
                      ...widget,
                      layout: {
                        i: newLayout.i,
                        x: newLayout.x,
                        y: newLayout.y,
                        w: newLayout.w,
                        h: newLayout.h,
                        minH:
                          widget.type == 'markdown'
                            ? widConfig.markdown.minHeight
                            : widConfig.report.minHeight,
                        minW:
                          widget.type == 'markdown'
                            ? widConfig.markdown.minWidth
                            : widConfig.report.minWidth,
                      },
                    }
                  }

                  return widget
                })
              })
              setOriginalLayout(layout)
            }}
            layouts={{
              xxs: originalLayout,
              lg: originalLayout,
              md: originalLayout,
              sm: originalLayout,
            }}
            cols={{
              xxs: 40,
              xs: 40,
              lg: 40,
              md: 40,
              sm: 40,
            }}
          >
            {widgets.map(
              (item: {
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
              }) => (
                <div
                  key={item.layout.i}
                  className="w-full h-full widget rounded-lg bg-accent/50 flex flex-col border"
                >
                  <Widget
                    editing={editing}
                    setSelectedReport={setSelectedReport}
                    item={item}
                    setEditingReportNameDialogOpen={
                      setEditingReportNameDialogOpen
                    }
                    setRemovingReportDialogOpen={setRemovingWidgetDialogOpen}
                    setWidgets={setWidgets}
                  />
                </div>
              )
            )}
          </ResponsiveGridLayout>
        )}
      </div>
    </div>
  )
}
