import Link from 'next/link'
import { useState, useEffect, ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { BarChart } from '@/components/charts/bar'
import { DoughnutChart } from '@/components/charts/doughnut'
import { LineChart } from '@/components/charts/line'
import { NumberReport } from '@/components/charts/number'
import { PieChart } from '@/components/charts/pie'
import { PolarAreaChart } from '@/components/charts/polar-area'
import { TableReport } from '@/components/charts/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/services/api'
import { formatDataset } from '@/utils/format-dataset'

export const RenderWidget = ({
  content,
  type,
  editing,
  onChangeContent,
  display,
  loadingReportUpdate,
}: {
  content: string
  type: 'markdown' | 'report'
  editing?: boolean
  onChangeContent?: (content: string) => void
  display?: string
  loadingReportUpdate?: boolean
}) => {
  const [queryResult, setQueryResult] = useState<Array<Record<string, any>>>([])
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState('')
  const [reportCustomizations, setReportCustomizations] =
    useState<Record<string, any>>()

  useEffect(() => {
    const getQueryResult = async () => {
      if (type !== 'report') return null

      setLoading(true)

      const { data: report } = await api.get(`/report/${content}`)

      setReportType(report.display)
      setReportCustomizations(JSON.parse(report.customizations || '{}'))

      const { data } = await api.post('/query', {
        dataSourceId: report.dataSourceId,
        query: report.query,
      })

      setQueryResult(data)

      setLoading(false)
    }

    getQueryResult()
  }, [content, type])

  useEffect(() => {
    if (!display) return

    setReportType(display)
  }, [display])

  if (loading || loadingReportUpdate) {
    return <Skeleton id="skeleton" className="w-full h-full" />
  }

  if (type === 'markdown') {
    return editing ? (
      <Textarea
        value={content}
        className="h-full resize-none w-full"
        onChange={(event) => {
          onChangeContent?.(event.target.value)
        }}
      />
    ) : (
      <div className="w-full h-full widget prose max-w-none text-foreground markdown">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            // @ts-ignore
            input: Checkbox,
            a: ({ children, href }) => (
              <Link href={href!} className="text-primary">
                {children}
              </Link>
            ),
          }}
          className="p-4 w-full h-full overflow-y-auto"
        >
          {content}
        </Markdown>
      </div>
    )
  }

  const {
    datasets = [],
    labels: labelsKeys,
    indexAxis,
    xStacked,
    yStacked,
  } = reportCustomizations || {}

  if (reportType === 'table') {
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

  if (reportType === 'number') {
    return <NumberReport data={Object.values(queryResult[0] || {})?.[0]} />
  }

  const { data, labels } = formatDataset({
    datasets,
    display: reportType,
    labelsKeys,
    queryResult,
  })

  const reportTypes: Record<string, ReactNode> = {
    pie: <PieChart labels={labels} data={data} />,
    line: <LineChart data={data} labels={labels} />,
    bar: (
      <BarChart
        data={data}
        labels={labels}
        indexAxis={indexAxis}
        xStacked={xStacked}
        yStacked={yStacked}
      />
    ),
    polararea: <PolarAreaChart data={data} labels={labels} />,
    doughnut: <DoughnutChart data={data} labels={labels} />,
  }

  return reportTypes[reportType] || null
}
