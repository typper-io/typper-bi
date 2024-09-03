'use client'

import { AlertTriangle, CheckCheck, Copy, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { AxiosError } from 'axios'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/services/api'
import { ChangePhrase } from '@/components/change-phrase'
import { loadingPhrases } from '@/constants/loading-phrases'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { columns } from '@/components/errors/columns'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { DataTable } from '@/components/errors/data-table'

const accessStrings = {
  DRIVE: process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_EMAIL as string,
}

export default function URL() {
  const [loading, setLoading] = useState(false)
  const [sourceType, setSourceType] = useState<string>('')
  const [responseError, setResponseError] = useState<
    string | React.ReactElement
  >('')
  const [copied, setCopied] = useState<Record<string, boolean>>({})
  const [dataSourceErrors, setDataSourceErrors] = useState<
    Array<{ columnOrLine: string; description: string; page: string }>
  >([])
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [file, setFile] = useState<File | null>(null)

  const router = useRouter()
  const params = useSearchParams()

  const URLSchema = useMemo(() => {
    const regexBySourceType: Record<string, RegExp> = {
      Postgres:
        /^postgresql:\/\/([^:\/\s]+):([^@\/\s]+)@([^:\/\s]+):(\d+)\/(\w+)(\?.*)?$/,
      MongoDB:
        /^mongodb\+srv:\/\/[a-zA-Z0-9]+:[a-zA-Z0-9]+@([a-zA-Z0-9]+-)*[a-zA-Z0-9]+\.[a-zA-Z0-9]+\/[a-zA-Z0-9]+(\?.*)?$/,
      'Google Sheets':
        /https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+\/edit(\?usp=sharing)?(#gid=[0-9]+)?/,
    }

    const exampleValidUrl: Record<string, string> = {
      Postgres: 'postgresql://username:password@hostname:port/database',
      MongoDB: 'mongodb+srv://username:password@hostname:port/database',
      'Google Sheets':
        'https://docs.google.com/spreadsheets/d/spreadsheetsid/edit#gid=0',
    }

    return z.object({
      ...(sourceType !== 'BigQuery' && {
        url: z
          .string({
            required_error: 'URL is required.',
          })
          .min(1, 'URL is required.')
          .regex(regexBySourceType[sourceType], {
            message: `URL must be valid. Example url: ${exampleValidUrl[sourceType]}.`,
          }),
      }),
      ...(sourceType === 'BigQuery' && {
        provider: z.string().default('BigQuery'),
      }),
      dataSourceName: z
        .string({
          required_error: 'DataSource name is required.',
        })
        .min(1, 'DataSource name is required.'),
    })
  }, [sourceType])

  useEffect(() => {
    setSourceType(params.get('sourceType') || 'Postgres')
  }, [params])

  type Schema = z.infer<typeof URLSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Schema>({
    resolver: zodResolver(URLSchema),
  })

  const table = useReactTable({
    data: dataSourceErrors,
    columns: columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const onSubmit = useCallback(
    async (data: Schema) => {
      try {
        setResponseError('')
        setLoading(true)

        const formData = new FormData()

        if (sourceType !== 'BigQuery') {
          formData.append('url', data.url as string)
          formData.append('dataSourceName', data.dataSourceName)
        } else {
          formData.append('provider', data.provider as string)
          formData.append('file', file!)
          formData.append('dataSourceName', data.dataSourceName)
        }

        const { data: responseData } = await api.post(
          '/data-source',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )

        const { dataSourceId } = responseData

        return router.push(
          `/app/data-source/schemas?dataSourceId=${dataSourceId}`
        )
      } catch (error) {
        setLoading(false)

        if (error instanceof AxiosError) {
          if (error.response?.data?.reason === 'invalid-data-source') {
            setDataSourceErrors(error.response?.data?.errors)
          }

          if (error.response?.status! <= 499) {
            if (
              error.response?.data.message ===
              'This operation is not supported for this document'
            ) {
              return setResponseError(
                <>
                  The file format is not supported. Try{' '}
                  <a
                    className="underline"
                    href="https://docs.bi.typper.io/datasources/sheets#unsupported-file-formats"
                    about="blank"
                  >
                    converting it to Google Sheets
                  </a>
                  .
                </>
              )
            }

            return setResponseError(error.response?.data.message)
          }
        }

        setResponseError(
          'We are unable to connect to the data source. Check that the fields below are correct.'
        )
      }
    },
    [file, router, sourceType]
  )

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopied((prev) => ({ ...prev, [text]: true }))
  }, [])

  return (
    <>
      {loading ? (
        <div className="p-8 h-full gap-8 flex flex-col items-center justify-center bg-accent/50 rounded-md">
          <div className="animate-spin w-fit text-primary">
            <Loader2 size={160} />
          </div>
          <div className="flex flex-col gap-2 items-center justify-center">
            <h2 className="text-xl leading-7 font-semibold">Loading schemas</h2>
            <p className="text-sm">
              <ChangePhrase phrases={loadingPhrases} />
            </p>
          </div>
        </div>
      ) : dataSourceErrors.length ? (
        <div className="p-4 h-full gap-4 flex flex-col bg-accent/50 rounded-lg overflow-y-auto">
          <div className="flex items-center gap-4">
            <div className="bg-[#FACC15] rounded-[4px] w-8 h-8 flex items-center justify-center">
              <AlertTriangle size={16} color="#422006" />
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-bold text-xl">Sheet reading error</p>
              <p className="text-base">
                Correct the following spreadsheet rows and columns and try
                again:
              </p>
            </div>
          </div>
          <DataTable table={table} />
        </div>
      ) : (
        <div className="p-4 h-full gap-8 flex flex-col bg-accent/50 rounded-lg overflow-y-auto">
          {responseError && (
            <Alert className="text-destructive">
              <AlertTriangle
                color="#7F1D1D"
                className="h-4 w-4 text-destructive"
              />
              <AlertTitle>Connection error</AlertTitle>
              <AlertDescription>{responseError}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-y-2">
            <Label>Data source type</Label>
            <Select
              onValueChange={(e: string) => setSourceType(e)}
              value={sourceType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a data source type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Postgres">Postgres</SelectItem>
                <SelectItem value="MongoDB">MongoDB</SelectItem>
                <SelectItem value="Google Sheets">Google Sheets</SelectItem>
                <SelectItem value="BigQuery">BigQuery</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {sourceType !== 'BigQuery' && (
            <div className="flex flex-col gap-y-2">
              <Label
                className={cn({
                  'text-destructive': errors.url?.message,
                })}
              >
                URL
              </Label>
              <Input
                placeholder={
                  sourceType === 'Postgres'
                    ? 'postgresql://username:password@hostname:port/database'
                    : sourceType === 'MongoDB'
                    ? 'mongodb+srv://username:password@hostname:port/database'
                    : sourceType === 'Google Sheets'
                    ? 'https://docs.google.com/spreadsheets/d/spreadsheetsid/edit#gid=0'
                    : 'postgresql://username:password@hostname:port/database'
                }
                {...register('url')}
              />
              {sourceType !== 'Google Sheets' && (
                <>
                  <p className="text-muted-foreground leading-5 text-sm pl-2">
                    You need to input the full data source URL. <br /> 1. The
                    user being used should have read access to all schemas and
                    tables they wish. <br />
                    2. The user will only be used once.
                  </p>
                </>
              )}
              <p className="text-xs text-destructive">{errors.url?.message}</p>
            </div>
          )}

          {sourceType === 'BigQuery' && (
            <div className="flex flex-col gap-y-2">
              <Label
                className={cn({
                  'text-destructive': errors.url?.message,
                })}
              >
                Service account key
              </Label>
              <Input
                accept=".json"
                max={1}
                type="file"
                placeholder="Upload your service account key"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null)
                }}
              />
              <p className="text-xs text-destructive">{errors.url?.message}</p>
            </div>
          )}

          {sourceType !== 'BigQuery' &&
            (sourceType === 'Google Sheets' ? (
              <div className="flex flex-col gap-2">
                <p>Share read permission</p>
                <div className="bg-transparent w-full border p-4 rounded-lg">
                  <div className="gap-4 flex flex-col">
                    <div className="flex flex-col gap-1">
                      <div>Give viewer access to Typper BI&apos;s e-mail:</div>
                      <Button
                        variant="ghost"
                        onClick={() => copy(accessStrings.DRIVE)}
                        className="px-3 py-2 bg-primary/10 rounded-sm items-center justify-between flex"
                      >
                        {accessStrings.DRIVE}

                        <div className="flex items-center gap-2">
                          {copied[accessStrings.DRIVE] && (
                            <p className="animate-fade-in">Copied!</p>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copy(accessStrings.DRIVE)}
                            asChild
                          >
                            <div>
                              {copied[accessStrings.DRIVE] ? (
                                <CheckCheck size={16} />
                              ) : (
                                <Copy size={16} />
                              )}
                            </div>
                          </Button>
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p>Typper BI IP address</p>
                <div className="bg-transparent w-full border p-4 rounded-lg">
                  <div className="gap-4 flex flex-col">
                    <div className="flex flex-col gap-1">
                      <div>
                        Please allow Typper BI&apos;s IP in your firewall to
                        allow Typper BI to make a connection to your data
                        source.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          <div className="flex flex-col gap-2 w-full">
            <Label
              className={cn({
                'text-destructive': errors.dataSourceName?.message,
              })}
            >
              Data Source name
            </Label>
            <Input
              placeholder="Data Source name"
              {...register('dataSourceName')}
            />
            <p className="text-xs text-destructive">
              {errors.dataSourceName?.message}
            </p>
          </div>
        </div>
      )}
      <div className="w-full flex justify-end pb-2">
        <Button
          onClick={
            dataSourceErrors.length
              ? () => {
                  setDataSourceErrors([])
                  setResponseError('')
                }
              : handleSubmit(onSubmit)
          }
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {dataSourceErrors.length ? 'Back to fix' : 'Connect Data Source'}
        </Button>
      </div>
    </>
  )
}
