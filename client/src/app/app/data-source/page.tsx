'use client'

import { toast } from 'sonner'
import {
  AlertCircle,
  Database,
  Edit3,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCcw,
  Settings2,
  Trash,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import Image from 'next/image'

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
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/services/api'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export default function DataSource() {
  const [dataSources, setDataSources] = useState<
    Array<{
      name: string
      id: string
      engine: string
      lastSyncAt: Date
      isReady: boolean
    }>
  >([])
  const [loading, setLoading] = useState(false)
  const [isLoadingSync, setIsLoadingSync] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedDataSource, setSelectedDataSource] = useState<{
    name: string
    id: string
  } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const router = useRouter()

  const fetchDataSources = useCallback(async () => {
    setLoading(true)

    const { data } = await api.get('/data-sources')

    setDataSources(data)

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDataSources()
  }, [fetchDataSources])

  const handleEditDataSourceName = useCallback(
    (dataSource: { name: string; id: string }) => {
      setEditDialogOpen(true)
      setSelectedDataSource(dataSource)
    },
    []
  )

  const handleDeleteDataSource = useCallback(
    (dataSource: { name: string; id: string }) => {
      setDeleteDialogOpen(true)
      setSelectedDataSource(dataSource)
    },
    []
  )

  const handleConfirmDeleteDataSource = useCallback(async () => {
    setLoadingDelete(true)

    await api.delete(`/data-source/${selectedDataSource?.id}`)

    setDeleteDialogOpen(false)
    setLoadingDelete(false)
    toast('Data Source deleted', {
      action: {
        label: 'Dismiss',
        onClick: () => toast.dismiss(),
      },
    })
    fetchDataSources()
  }, [fetchDataSources, selectedDataSource?.id])

  const handleSaveDataSourceName = useCallback(async () => {
    setLoadingEdit(true)

    await api.put(`/data-source/${selectedDataSource?.id}`, {
      dataSourceName: selectedDataSource?.name,
    })

    setEditDialogOpen(false)
    setLoadingEdit(false)
    toast('Data Source renamed', {
      action: {
        label: 'Dismiss',
        onClick: () => toast.dismiss(),
      },
    })
    fetchDataSources()
  }, [fetchDataSources, selectedDataSource?.id, selectedDataSource?.name])

  const handleGoToSchemas = useCallback(
    (dataSourceId: string) => {
      router.push(`/app/data-source/schemas?dataSourceId=${dataSourceId}`)
    },
    [router]
  )

  const handleSyncDataSource = useCallback(
    async ({ dataSourceId }: { dataSourceId: string }) => {
      try {
        setIsLoadingSync(true)

        await api.post(`/data-source/refresh/${dataSourceId}`)

        toast('Data source synced', {
          description: format(new Date(), 'dd/MM/yyyy HH:mm:ss'),
          action: {
            label: 'Dismiss',
            onClick: () => {
              toast.dismiss()
            },
          },
        })

        setIsLoadingSync(false)
        fetchDataSources()
      } catch {
        setIsLoadingSync(false)

        toast('Cannot sync data source', {
          description: format(new Date(), 'dd/MM/yyyy HH:mm:ss'),
          action: {
            label: 'Retry',
            onClick: () => {
              handleSyncDataSource({ dataSourceId })
            },
          },
        })
      }
    },
    [fetchDataSources]
  )

  const logosByEngine: Record<string, string> = {
    Postgres: '/logos/postgres.svg',
    Mongo: '/logos/mongodb.svg',
    Sheets: '/logos/sheets.svg',
    BigQuery: '/logos/bigquery.svg',
  }

  return (
    <div className="bg-accent/50 h-full w-full p-8 rounded-xl gap-8 flex flex-col">
      <div className="flex justify-between items-center">
        <p className="font-semibold text-3xl leading-9">Data Sources</p>
        <Button className="gap-2" variant="secondary" asChild>
          <Link href="/app/data-source/type">
            <Plus size={16} />
            Add Data Source
          </Link>
        </Button>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete data source</DialogTitle>
            <DialogDescription>
              When you delete the {selectedDataSource?.name} data source, you
              will lose all chat history and it will be deleted from Typper BI.
              <br />
              <br />
              You can still add the data source again.
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
              onClick={handleConfirmDeleteDataSource}
              disabled={loadingDelete}
              className="gap-2"
            >
              {loadingDelete && <Loader2 size={16} className="animate-spin" />}
              Delete data source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename data source</DialogTitle>
            <DialogDescription>
              Edit {selectedDataSource?.name} data source name.
            </DialogDescription>
          </DialogHeader>
          <div className="flex w-full gap-4 items-center">
            <Label htmlFor="name" className="w-20 text-right">
              Name
            </Label>
            <Input
              id="name"
              defaultValue={selectedDataSource?.name}
              onChange={(event) => {
                setSelectedDataSource({
                  id: selectedDataSource?.id ?? '',
                  name: event.target.value,
                })
              }}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleSaveDataSourceName}
              disabled={loadingEdit}
              className="gap-2"
            >
              {loadingEdit && <Loader2 size={16} className="animate-spin" />}
              Save data source name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4 overflow-y-auto bg-accent/50 w-full h-full p-4 rounded-xl">
        {!loading &&
          dataSources.map((dataSource, index) => (
            <div key={dataSource.id} className="flex flex-col gap-4">
              <div className="w-full flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <div className="p-3 flex items-center justify-center bg-accent/50 rounded-sm">
                    <Image
                      src={logosByEngine[dataSource.engine]}
                      alt={dataSource.engine}
                      width={24}
                      height={24}
                    />
                  </div>

                  <p className="font-semibold leading-8 text-2xl">
                    {dataSource.name}
                  </p>
                </div>
                <div className="flex gap-4 items-center">
                  {dataSource.lastSyncAt && (
                    <p className="text-xs leading-5 text-muted-foreground">
                      Updated at{' '}
                      {format(dataSource.lastSyncAt, 'yyyy/MM/dd HH:mm')}
                    </p>
                  )}
                  {dataSource.engine === 'Sheets' && dataSource.isReady && (
                    <Button
                      className="gap-2 border"
                      variant="ghost"
                      disabled={isLoadingSync}
                      onClick={() =>
                        handleSyncDataSource({ dataSourceId: dataSource.id })
                      }
                    >
                      <RefreshCcw
                        size={16}
                        className={cn({ 'animate-spin': isLoadingSync })}
                      />
                      Sync
                    </Button>
                  )}
                  {!dataSource.isReady && (
                    <div className="flex gap-4 items-center">
                      <p className="flex gap-2 items-center text-[#FACC15]">
                        <AlertCircle size={16} color="#FACC15" /> Data Source
                        not fully added
                      </p>
                      <Button onClick={() => handleGoToSchemas(dataSource.id)}>
                        Continue setup
                      </Button>
                    </div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button
                        size="icon"
                        variant="outline"
                        className="bg-transparent"
                      >
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => handleEditDataSourceName(dataSource)}
                      >
                        <Edit3 size={16} />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => handleGoToSchemas(dataSource.id)}
                      >
                        <Settings2 size={16} />
                        Edit schemas
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => handleDeleteDataSource(dataSource)}
                      >
                        <Trash size={16} />
                        Delete data source
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {index !== dataSources.length - 1 && <Separator />}
            </div>
          ))}

        {loading && (
          <div className="flex flex-col gap-8 w-full">
            <Skeleton className="w-full h-[48px]" />
            <Skeleton className="w-full h-[48px]" />
            <Skeleton className="w-full h-[48px]" />
          </div>
        )}

        {!loading && dataSources.length === 0 && (
          <div className="w-full h-full flex items-center justify-center gap-4 flex-col">
            <p className="text-muted-foreground">
              The data sources you create will appear here.
            </p>

            <Button className="gap-2" asChild>
              <Link href="/app/data-source/type">
                <Database size={16} />
                Add data source
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
