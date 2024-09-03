'use client'

import { AxiosError } from 'axios'
import {
  AlertCircle,
  AlertTriangle,
  BarChart4,
  Binary,
  CalendarIcon,
  Database,
  Donut,
  HelpCircle,
  LineChart as LineChartIcon,
  Loader2,
  PieChart as PieChartIcon,
  Play,
  Plus,
  Table,
  Variable,
  Wand2,
  X,
} from 'lucide-react'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useSearchParams } from 'next/navigation'
import { format as sqlFormat } from 'sql-formatter'
import Link from 'next/link'
import { CirclesThree } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

import { CodeEditor } from '@/components/code-editor'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/services/api'
import { TableReport } from '@/components/charts/table'
import { SaveReport } from '@/components/save-report-button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { BarChart } from '@/components/charts/bar'
import { LineChart } from '@/components/charts/line'
import { PieChart } from '@/components/charts/pie'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Logo } from '@/components/logo'
import { CodeView } from '@/components/chat/code'
import { useLocalStorage } from '@/hooks/use-localstorage'
import { NumberReport } from '@/components/charts/number'
import { PolarAreaChart } from '@/components/charts/polar-area'
import { DoughnutChart } from '@/components/charts/doughnut'
import { formatDataset } from '@/utils/format-dataset'
import { Tour } from '@/components/tour'

interface DataSource {
  id: string
  name: string
  engine: string
  lastSyncAt: Date
}

const RenderFilter = ({
  name,
  type,
  filterValues,
  setFilterValues,
  key,
}: {
  name: string
  type: string
  filterValues: Record<string, any>
  setFilterValues: React.Dispatch<React.SetStateAction<Record<string, any>>>
  key: string
}) => {
  const [open, setOpen] = useState(false)

  if (type === 'date')
    return (
      <Popover open={open} onOpenChange={setOpen} key={key}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="px-4 py-2 gap-2 text-left font-normal bg-transparent w-fit justify-start"
          >
            <CalendarIcon size={16} />

            {filterValues[name] ? (
              format(filterValues[name], 'PPP')
            ) : (
              <span>{name}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filterValues[name]}
            onSelect={(date) => {
              setFilterValues((current) => ({
                ...current,
                [name]: date,
              }))
              setOpen(false)
            }}
            disabled={(date) =>
              date > new Date() || date < new Date('1900-01-01')
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )

  if (type === 'number') {
    return (
      <Input
        key={key}
        type="number"
        className="bg-transparent w-fit"
        placeholder={name}
        value={filterValues[name]}
        onChange={(e) => {
          setFilterValues((current) => ({
            ...current,
            [name]: e.target.value,
          }))
        }}
      />
    )
  }

  if (type === 'boolean') {
    return (
      <Select
        key={key}
        onValueChange={(value) => {
          setFilterValues((current) => ({
            ...current,
            [name]: value,
          }))
        }}
        value={filterValues[name]}
      >
        <SelectTrigger className="bg-transparent w-fit">
          <SelectValue placeholder="Select" />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  if (type === 'string') {
    return (
      <Input
        key={key}
        type="text"
        className="bg-transparent w-fit"
        placeholder={name}
        value={filterValues[name]}
        onChange={(e) => {
          setFilterValues((current) => ({
            ...current,
            [name]: e.target.value,
          }))
        }}
      />
    )
  }
}

const RenderReport = ({
  display,
  queryResult,
}: {
  display: string
  queryResult: Array<Record<string, any>>
}) => {
  if (display === 'table') {
    const tableData = queryResult.map((result) => {
      Object.keys(result).forEach((key) => {
        if (typeof result[key] === 'object') {
          result[key] = JSON.stringify(result[key])
        }
      })

      return result
    })

    return <TableReport data={tableData} />
  }

  if (display === 'number') {
    return <NumberReport data={Object.values(queryResult[0] || {})?.[0]} />
  }

  const { labels, data } = formatDataset({
    datasets: [
      {
        data: Object.keys(queryResult[0] || {})[1],
        fill: false,
        label: display,
        type: display,
      },
    ],
    display,
    labelsKeys: Object.keys(queryResult[0] || {})[0],
    queryResult,
  })

  const reportTypes: Record<string, ReactNode> = {
    pie: <PieChart labels={labels} data={data} />,
    line: <LineChart data={data} labels={labels} />,
    bar: <BarChart data={data} labels={labels} />,
    polararea: <PolarAreaChart data={data} labels={labels} />,
    doughnut: <DoughnutChart data={data} labels={labels} />,
  }

  return reportTypes[display] || null
}

export default function Query() {
  const searchParams = useSearchParams()

  const dataSourceId = searchParams.get('dataSourceId') || ''
  const queryParamsQuery = searchParams.get('query') || ''

  const [storedValue, setStoreValue] = useLocalStorage('selectedDataSource', '')
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [selectedDataSource, setSelectedDataSource] =
    useState<string>(dataSourceId)
  const [queryValue, setQueryValue] = useState(queryParamsQuery)
  const [queryResult, setQueryResult] = useState<any[]>([])
  const [runningQuery, setRunningQuery] = useState(false)
  const [helpMessage, setHelpMessage] = useState('')
  const [helpSuggestions, setHelpSuggestions] = useState<string>('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [selectedDisplay, setSelectedDisplay] = useState<string>('table')
  const [filtersOpened, setFiltersOpened] = useState(false)
  const [queryError, setQueryError] = useState({
    errorMessage: '',
    errorStatus: 0,
  })
  const [loadingQueryHelp, setLoadingQueryHelp] = useState(false)
  const [engine, setEngine] = useState('')

  useEffect(() => {
    const regex = /{{(.*?)}}/g

    const matches = queryValue.match(regex)

    if (!matches) {
      if (Object.keys(filters).length === 0) return

      setFilters({})

      return
    }

    const newFilters: Record<string, string> = {}

    matches.forEach((match) => {
      const key = match.replace(/{{|}}/g, '')

      const keyFormatted = key.replaceAll(' ', '_').toLowerCase()

      newFilters[keyFormatted] = filters[keyFormatted] || 'string'
    })

    if (JSON.stringify(newFilters) === JSON.stringify(filters)) return

    setFilters(newFilters)
  }, [queryValue, filters])

  useEffect(() => {
    if (storedValue && !selectedDataSource) {
      setSelectedDataSource(storedValue)
    }

    if (selectedDataSource && dataSources.length && !engine) {
      setEngine(
        dataSources.find((dataSource) => dataSource.id === selectedDataSource)
          ?.engine || 'Postgres'
      )
    }
  }, [storedValue, selectedDataSource, dataSources, engine])

  const getDataSources = useCallback(async () => {
    const { data } = await api.get('/data-sources?readyOnly=true')

    setDataSources(data)
  }, [])

  useEffect(() => {
    getDataSources()
  }, [getDataSources])

  const handleHelp = useCallback(async () => {
    setLoadingQueryHelp(true)

    const { data } = await api.post('/query/help', {
      dataSourceId: selectedDataSource,
      query: queryValue,
      error: queryError.errorMessage,
    })

    setLoadingQueryHelp(false)

    setHelpMessage(data.explanation)
    setHelpSuggestions(data.suggestion)
  }, [selectedDataSource, queryValue, queryError.errorMessage])

  const handleCorrectQuery = useCallback(async () => {
    setQueryValue(
      engine === 'Mongo' ? helpSuggestions : sqlFormat(helpSuggestions)
    )
    setQueryError({
      errorMessage: '',
      errorStatus: 0,
    })
    setHelpMessage('')
    setHelpSuggestions('')
  }, [engine, helpSuggestions])

  const handleRunQuery = useCallback(async () => {
    try {
      if (!selectedDataSource || !queryValue) return

      setRunningQuery(true)

      const { data } = await api.post('/query', {
        dataSourceId: selectedDataSource,
        query: engine === 'Mongo' ? JSON.stringify(queryValue) : queryValue,
        arguments: filterValues,
      })

      setQueryResult(data)
      setRunningQuery(false)
      setQueryError({
        errorMessage: '',
        errorStatus: 0,
      })
      setHelpSuggestions('')
      setHelpMessage('')
    } catch (error) {
      if (error instanceof AxiosError) {
        setQueryError({
          errorMessage: error.response?.data.message || '',
          errorStatus: error.response?.status || 0,
        })
      }

      setRunningQuery(false)
    }
  }, [selectedDataSource, queryValue, engine, filterValues])

  const clearAll = useCallback(() => {
    setQueryValue('')
    setQueryResult([])
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleRunQuery()
      }

      if (e.altKey && e.shiftKey && e.code === 'KeyF') {
        e.preventDefault()
        setQueryValue(
          engine === 'Mongo' ? jsonFormat(queryValue) : sqlFormat(queryValue)
        )
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [selectedDataSource, queryValue, handleRunQuery, engine])

  return (
    <div className="bg-accent/50 w-full p-8 rounded-xl h-full flex flex-col gap-8 overflow-auto">
      <Tour
        id="query-tour"
        steps={[
          {
            title: 'Select a data source',
            content: 'To run queries, you must select a data source.',
            target: '#data-source-trigger',
            placement: 'right-start',
            disableBeacon: true,
          },
        ]}
      />

      <div className="flex justify-between items-center">
        <p className="text-3xl leading-9 font-semibold">Query</p>

        <div className="flex gap-4">
          <Button variant="secondary" className="gap-2" onClick={clearAll}>
            <Plus size={16} /> New Query
          </Button>

          {!!dataSources.length && (
            <SaveReport
              dataSourceId={selectedDataSource || ''}
              display={selectedDisplay}
              query={queryValue}
              arguments={filters}
              disabled={!queryValue || !selectedDataSource}
            />
          )}
        </div>
      </div>

      {!!dataSources.length && (
        <div className="flex gap-6 h-full">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel
              minSize={20}
              className="bg-background w-full h-fit p-4 flex flex-col gap-4 rounded-t-md"
            >
              <Select
                value={selectedDataSource}
                onValueChange={(value) => {
                  setSelectedDataSource(value)
                  value && setStoreValue(value)
                  setEngine(
                    dataSources.find((dataSource) => dataSource.id === value)
                      ?.engine || 'Postgres'
                  )
                }}
              >
                <SelectTrigger className="w-[150px]" id="data-source-trigger">
                  <SelectValue placeholder="Select a data source" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    {dataSources.map((dataSource) => (
                      <SelectItem value={dataSource.id} key={dataSource.id}>
                        {dataSource.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <div className="w-full h-full border-input border-solid border rounded-xl py-2 overflow-hidden">
                <CodeEditor
                  dataSourceId={selectedDataSource || ''}
                  queryValue={queryValue}
                  setQueryValue={setQueryValue}
                  language={engine === 'Mongo' ? 'json' : 'sql'}
                  engine={engine}
                  runQuery={handleRunQuery}
                  formatQuery={() =>
                    setQueryValue(
                      engine === 'Mongo'
                        ? jsonFormat(queryValue)
                        : sqlFormat(queryValue)
                    )
                  }
                />
              </div>

              <Button
                className="gap-2 w-fit"
                onClick={handleRunQuery}
                disabled={runningQuery}
              >
                {runningQuery ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Play size={16} />
                )}
                Run
              </Button>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel
              minSize={20}
              className="w-full bg-accent/50 h-full rounded-b-md p-4 border-x-border border-b-border border-x-solid border-b-solid border-x border-b flex flex-col gap-4"
            >
              {queryError.errorMessage ? (
                queryError.errorStatus === 500 ? (
                  <div className="flex flex-col gap-4">
                    <div className="p-2 bg-[#FACC15] rounded-md w-fit h-fit">
                      <AlertCircle size={16} color="#422006" />
                    </div>
                    <div>
                      <p className="text-xl leading-7 font-semibold">
                        Error 023
                      </p>
                      <p className="text-base leading-7">
                        Please contact us if this error continues to occur
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <Button
                        variant="secondary"
                        className="gap-2"
                        onClick={handleRunQuery}
                      >
                        <Play size={16} /> Try again
                      </Button>

                      <Link href="mailto:contact@typper.io?subject=Help%20with%20chat">
                        <Button variant="secondary" className="gap-2">
                          <HelpCircle size={16} /> Contact our support
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 overflow-y-auto">
                    <div className="p-2 bg-[#FACC15] rounded-md w-fit h-fit">
                      <AlertTriangle size={16} color="#422006" />
                    </div>
                    <div>
                      <p className="text-xl leading-7 font-semibold">
                        {loadingQueryHelp ? 'Analyzing...' : 'Query error'}
                      </p>
                      <p className="text-base leading-7">
                        {loadingQueryHelp
                          ? `It's will can take a few seconds.`
                          : helpMessage
                          ? helpMessage
                          : queryError.errorMessage}
                      </p>
                      {helpSuggestions && (
                        <CodeView
                          language="sql"
                          correctQuery={handleCorrectQuery}
                          isQueryView={true}
                        >
                          {helpSuggestions}
                        </CodeView>
                      )}
                    </div>

                    {!helpMessage && !helpSuggestions && (
                      <Alert className="gap-4 flex border-none bg-accent/50">
                        <Logo size={24} />

                        <div className="flex flex-col gap-4">
                          <AlertDescription>
                            I can help you fix this with that error!
                          </AlertDescription>
                          <Button
                            className="gap-2"
                            disabled={loadingQueryHelp}
                            onClick={handleHelp}
                          >
                            {loadingQueryHelp ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Wand2 size={16} />
                            )}
                            Correct with Typper AI
                          </Button>
                        </div>
                      </Alert>
                    )}
                  </div>
                )
              ) : (
                <div className="w-full h-full flex flex-col relative gap-4">
                  <div className="flex gap-4">
                    {Object.entries(filters).map(([key, value]) => (
                      <RenderFilter
                        key={key}
                        name={key}
                        type={value}
                        filterValues={filterValues}
                        setFilterValues={setFilterValues}
                      />
                    ))}
                  </div>
                  <div className="flex flex-col gap-4 bg-accent/50 border h-full p-4 rounded-lg overflow-auto">
                    <div className="flex p-1 gap-2 bg-muted rounded-md">
                      <Button
                        variant="secondary"
                        className={cn('gap-2', {
                          'bg-background': selectedDisplay === 'table',
                        })}
                        onClick={() => setSelectedDisplay('table')}
                      >
                        <Table size={16} /> Table
                      </Button>
                      <Button
                        variant="secondary"
                        className={cn('gap-2', {
                          'bg-background': selectedDisplay === 'bar',
                        })}
                        onClick={() => setSelectedDisplay('bar')}
                      >
                        <BarChart4 size={16} /> Bar
                      </Button>
                      <Button
                        variant="secondary"
                        className={cn('gap-2', {
                          'bg-background': selectedDisplay === 'line',
                        })}
                        onClick={() => setSelectedDisplay('line')}
                      >
                        <LineChartIcon size={16} /> Line
                      </Button>
                      <Button
                        variant="secondary"
                        className={cn('gap-2', {
                          'bg-background': selectedDisplay === 'pie',
                        })}
                        onClick={() => setSelectedDisplay('pie')}
                      >
                        <PieChartIcon size={16} /> Pie
                      </Button>
                      <Button
                        variant="secondary"
                        className={cn('gap-2', {
                          'bg-background': selectedDisplay === 'number',
                        })}
                        onClick={() => setSelectedDisplay('number')}
                      >
                        <Binary size={16} /> Number
                      </Button>
                      <Button
                        variant="secondary"
                        className={cn('gap-2', {
                          'bg-background': selectedDisplay === 'doughnut',
                        })}
                        onClick={() => setSelectedDisplay('doughnut')}
                      >
                        <Donut size={16} /> Doughnut
                      </Button>
                      <Button
                        variant="secondary"
                        className={cn('gap-2', {
                          'bg-background': selectedDisplay === 'polararea',
                        })}
                        onClick={() => setSelectedDisplay('polararea')}
                      >
                        <CirclesThree size={16} /> Polar Area
                      </Button>
                    </div>

                    <RenderReport
                      display={selectedDisplay}
                      queryResult={queryResult}
                    />
                  </div>
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>

          {Object.keys(filters).length > 0 && (
            <div
              className={cn(
                'min-h-full overflow-y-auto transition-wi p-4 rounded-md border-border border-solid border flex flex-col gap-8',
                {
                  'w-fit animate-close cursor-pointer overflow-hidden':
                    !filtersOpened,
                  'w-[20%] animate-open': filtersOpened,
                }
              )}
              onClick={
                !filtersOpened
                  ? () => setFiltersOpened(!filtersOpened)
                  : (e) => e.stopPropagation()
              }
            >
              {filtersOpened ? (
                <>
                  <div className="flex justify-between items-center">
                    <p className="text-lg leading-7 font-semibold">Variables</p>
                    <div
                      className="cursor-pointer"
                      onClick={() => setFiltersOpened(!filtersOpened)}
                    >
                      <X size={16} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-8">
                    {Object.entries(filters).map(([key, value], index) => (
                      <>
                        {index !== 0 && <Separator />}
                        <div className="flex flex-col gap-6">
                          <p>{key}</p>

                          <div className="flex flex-col gap-2">
                            <p>Type</p>
                            <Select
                              onValueChange={(value) => {
                                setFilters((current) => ({
                                  ...current,
                                  [key]: value as string,
                                }))
                              }}
                              value={value}
                            >
                              <SelectTrigger className="w-full bg-secondary">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>

                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value="string">Text</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">
                                    Boolean
                                  </SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    ))}
                  </div>
                </>
              ) : (
                <Variable size={16} />
              )}
            </div>
          )}
        </div>
      )}

      {!dataSources.length && (
        <div className="w-full h-full bg-accent/50 rounded-xl flex flex-col gap-4 justify-center items-center">
          <div className="flex flex-col gap-1 justify-center items-center">
            <p className="font-bold text-xl">Create a data source first</p>
            <p className="text-muted-foreground text-base">
              Before making queries, you need to add a data source.
            </p>
          </div>

          <Button className="gap-2" asChild>
            <Link href="/app/data-source/type">
              <Database size={16} />
              Add data source
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
