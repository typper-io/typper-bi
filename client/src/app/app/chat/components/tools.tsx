import { MessageBarChart } from '@/components/chat/reports/bar'
import { MessageDoughnutChart } from '@/components/chat/reports/doughnut'
import { MessageLineChart } from '@/components/chat/reports/line'
import { MessageNumberReport } from '@/components/chat/reports/number'
import { MessagePieChart } from '@/components/chat/reports/pie'
import { MessagePolarChart } from '@/components/chat/reports/polar-area'
import { ChatTableReport } from '@/components/chat/reports/table'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { DataMessage, Message } from '@/hooks/use-assistant/types'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import { formatDataset } from '@/utils/format-dataset'
import {
  BarChart2,
  Check,
  ChevronDown,
  ChevronUp,
  Code,
  Globe,
  Pen,
  Search,
  X,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism'

const CircularLoading = ({
  progress,
  icon,
  status,
}: {
  progress: number
  icon: React.ReactNode
  status: string
}) => {
  const radius = 40
  const strokeWidth = useMemo(() => (progress === 100 ? 0 : 8), [progress])
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative flex justify-center items-center w-7 h-7">
      <svg
        className="transform -rotate-90"
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
      >
        <circle
          className={cn('text-foreground/50', {
            'fill-transparent': status !== 'completed',
            'fill-[#ADFA1D1A]': status === 'completed',
            'fill-[#DC26261A]': status === 'failed',
            'fill-muted/50': status === 'expired',
          })}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          r={radius}
          cx="50"
          cy="50"
        />
        <circle
          className="text-foreground progress-circle transition-all duration-300"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx="50"
          cy="50"
          style={{
            transition: 'stroke-dashoffset 0.5s ease-out',
          }}
        />
      </svg>
      {icon}
    </div>
  )
}

const ToolCallComponent = ({
  status,
  name,
  query,
  code,
  error,
}: {
  status: string
  name: string
  query?: string
  code?: string
  error: string
}) => {
  const { theme } = useTheme()

  const [open, setOpen] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)

  const toolStatus = useMemo(() => {
    if (error) return 'failed'

    return status
  }, [error, status])

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress((v) => (v >= 90 ? 90 : v + 5))
    }, 1000)

    const timeout = setTimeout(() => {
      clearInterval(interval)
    }, 20000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  const statusTranslated = useMemo(() => {
    const translatedStatus: Record<string, string> = {
      queued: 'in_progress',
      in_progress: 'in_progress',
      requires_action: 'in_progress',
      cancelling: 'in_progress',
      cancelled: 'failed',
      failed: 'failed',
      expired: 'expired',
      completed: 'completed',
    }

    return translatedStatus[toolStatus]
  }, [toolStatus])

  const icons: Record<string, ReactNode> = {
    retrieval: <Search size={14} className="absolute animate-fade-in" />,
    run_nl_query: <Code size={14} className="absolute animate-fade-in" />,
    code_interpreter: <Code size={14} className="absolute animate-fade-in" />,
    display_report: (
      <BarChart2 size={14} className="absolute animate-fade-in" />
    ),
    search_on_web: <Globe size={14} className="absolute animate-fade-in" />,
    save_user_information: (
      <Pen size={14} className="absolute animate-fade-in" />
    ),
    save_workspace_information: (
      <Pen size={14} className="absolute animate-fade-in" />
    ),
    save_datasource_information: (
      <Pen size={14} className="absolute animate-fade-in" />
    ),
  }

  const translatedLabel = useMemo(() => {
    const loadingLabel: Record<string, string> = {
      retrieval: 'Reading file',
      run_nl_query: 'Running query',
      code_interpreter: 'Running code',
      display_report: 'Displaying report',
      search_on_web: 'Searching on the web',
      save_user_information: 'Saving user information',
      save_workspace_information: 'Saving workspace information',
      save_datasource_information: 'Saving data source information',
    }

    const completedLabel: Record<string, string> = {
      retrieval: 'File read',
      run_nl_query: 'Query run',
      code_interpreter: 'Code run',
      display_report: 'Report displayed',
      search_on_web: 'Search on the web',
      save_user_information: 'User information saved',
      save_workspace_information: 'Workspace information saved',
      save_datasource_information: 'Data source information saved',
    }

    const failedLabel: Record<string, string> = {
      retrieval: 'Failed to read file',
      run_nl_query: 'Failed to run query',
      code_interpreter: 'Failed to run code',
      display_report: 'Failed to display report',
      search_on_web: 'Failed to search on the web',
      save_user_information: 'Failed to save user information',
      save_workspace_information: 'Failed to save workspace information',
      save_datasource_information: 'Failed to save data source information',
    }

    const statusWithLabels: Record<string, Record<string, string>> = {
      in_progress: loadingLabel,
      completed: completedLabel,
      failed: failedLabel,
      expired: failedLabel,
    }

    return statusWithLabels[statusTranslated][name]
  }, [name, statusTranslated])

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn('rounded-sm', {
        'bg-accent/50': open,
      })}
      disabled={!(statusTranslated === 'completed' && (query || code))}
    >
      <CollapsibleTrigger className="w-full">
        <div
          className={cn(
            'justify-between flex items-center w-full rounded-t-sm',
            {
              'px-3 py-1 hover:bg-accent border-b border-b-border border-b-solid':
                open,
            }
          )}
        >
          <div className="gap-2 flex items-center">
            <CircularLoading
              status={statusTranslated}
              progress={
                statusTranslated === 'completed' ||
                statusTranslated === 'failed'
                  ? 100
                  : loadingProgress
              }
              icon={
                statusTranslated === 'completed' ? (
                  <Check
                    size={14}
                    color="#ADFA1D"
                    className="absolute animate-fade-in"
                  />
                ) : statusTranslated === 'failed' ||
                  statusTranslated === 'expired' ? (
                  <X
                    size={14}
                    className={cn('absolute animate-fade-in', {
                      'text-[#DC2626]': statusTranslated === 'failed',
                      'text-muted-foreground': statusTranslated === 'expired',
                    })}
                  />
                ) : (
                  icons[name]
                )
              }
            />

            <p>{translatedLabel}</p>
          </div>
          {statusTranslated === 'completed' && (query || code) && (
            <Button variant="ghost" size="sm">
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          )}
        </div>
      </CollapsibleTrigger>
      {(query || code) && (
        <CollapsibleContent className="px-3 py-2">
          <SyntaxHighlighter
            PreTag="section"
            wrapLongLines={true}
            language={query ? 'sql' : 'python'}
            style={theme !== 'dark' ? oneLight : oneDark}
          >
            {String(query || code).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}

export const RenderTools = ({
  message,
  threadId,
}: {
  message: DataMessage['data']
  threadId: string
}) => {
  const [queryResult, setQueryResult] = useState<Array<Record<string, any>>>([])
  const [loading, setLoading] = useState(false)

  const isReport = message.name === 'display_report'

  const allowedTollCalls = useMemo(
    () => [
      'display_report',
      'retrieval',
      'run_nl_query',
      'code_interpreter',
      'search_on_web',
      'save_user_information',
      'save_workspace_information',
      'save_datasource_information',
    ],
    []
  )

  const {
    report_type: reportType,
    report_name,
    report_description: reportDescription,
    labels: labelsKey,
    datasets,
    indexAxis,
    xStacked,
    yStacked,
    dataSourceId,
  } = message.input || {}

  useEffect(() => {
    const getQueryResult = async () => {
      if (!isReport) return

      if (!allowedTollCalls.includes(message.name)) return null

      setLoading(true)

      if (message.status !== 'completed') return

      const { query: queryParsed } = message.output || {}

      if (!queryParsed) return

      const { data } = await api.post('/query', {
        dataSourceId,
        query: queryParsed,
      })

      setQueryResult(data)

      setLoading(false)
    }

    getQueryResult()
  }, [
    message.name,
    message.output,
    isReport,
    message.status,
    allowedTollCalls,
    dataSourceId,
  ])

  if (!allowedTollCalls.includes(message.name)) return null

  const { query, error } = message.output || {
    error: 'true',
  }

  if ((message.status !== 'completed' || error) && isReport) {
    return (
      <ToolCallComponent
        status={message.status}
        name={message.name}
        error={error}
      />
    )
  }

  if (!isReport) {
    const queryParam =
      message.name === 'run_nl_query' ? message.output.query : ''

    const showCode =
      message.name === 'code_interpreter' ||
      message.name === 'run_nl_query' ||
      message.name === 'run_mongo_query'

    return (
      <ToolCallComponent
        status={message.status}
        name={message.name}
        query={showCode ? queryParam : ''}
        code={showCode ? message.input : ''}
        error={error}
      />
    )
  }

  if (error) {
    return null
  }

  if (loading) {
    return <Skeleton className="w-full h-[300px]" />
  }

  if (reportType === 'table') {
    const tableData = queryResult.map((result) => {
      Object.keys(result).forEach((key) => {
        if (typeof result[key] === 'object') {
          result[key] = JSON.stringify(result[key])
        }
      })

      return result
    })

    return (
      <ChatTableReport
        data={tableData}
        dataSourceId={dataSourceId}
        threadId={threadId}
        query={query}
        name={report_name}
        description={reportDescription}
      />
    )
  }

  if (reportType === 'number') {
    return (
      <MessageNumberReport
        data={Object.values(queryResult[0] || {})?.[0]}
        dataSourceId={dataSourceId}
        threadId={threadId}
        query={query}
        name={report_name}
        description={reportDescription}
      />
    )
  }

  const formattedDatasets =
    typeof datasets === 'string' ? JSON.parse(datasets) : datasets

  const { data, labels } = formatDataset({
    datasets: formattedDatasets,
    labelsKeys: labelsKey,
    queryResult,
    display: reportType,
  })

  const reportTypes: Record<string, ReactNode> = {
    pie: (
      <MessagePieChart
        labels={labels}
        data={data}
        dataSourceId={dataSourceId}
        threadId={threadId}
        query={query}
        name={report_name}
        description={reportDescription}
        formattedDatasets={formattedDatasets}
        labelsKey={labelsKey}
      />
    ),
    line: (
      <MessageLineChart
        data={data}
        labels={labels}
        dataSourceId={dataSourceId}
        threadId={threadId}
        query={query}
        name={report_name}
        description={reportDescription}
        formattedDatasets={formattedDatasets}
        labelsKey={labelsKey}
      />
    ),
    bar: (
      <MessageBarChart
        data={data}
        labels={labels}
        dataSourceId={dataSourceId}
        threadId={threadId}
        query={query}
        name={report_name}
        description={reportDescription}
        indexAxis={indexAxis}
        xStacked={xStacked}
        yStacked={yStacked}
        formattedDatasets={formattedDatasets}
        labelsKey={labelsKey}
      />
    ),
    polararea: (
      <MessagePolarChart
        data={data}
        labels={labels}
        dataSourceId={dataSourceId}
        threadId={threadId}
        query={query}
        name={report_name}
        description={reportDescription}
        formattedDatasets={formattedDatasets}
        labelsKey={labelsKey}
      />
    ),
    doughnut: (
      <MessageDoughnutChart
        data={data}
        labels={labels}
        dataSourceId={dataSourceId}
        threadId={threadId}
        query={query}
        name={report_name}
        description={reportDescription}
        formattedDatasets={formattedDatasets}
        labelsKey={labelsKey}
      />
    ),
  }

  return reportTypes[reportType] || null
}
