'use client'

import { format } from 'date-fns'
import { ArrowLeft, CalendarIcon } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { ReportTypePicker } from '@/app/app/reports/[reportId]/components/report-type-picker'
import type { Report as ReportType } from '@/app/app/reports/page'
import { BarChart } from '@/components/charts/bar'
import { DoughnutChart } from '@/components/charts/doughnut'
import { LineChart } from '@/components/charts/line'
import { NumberReport } from '@/components/charts/number'
import { PieChart } from '@/components/charts/pie'
import { PolarAreaChart } from '@/components/charts/polar-area'
import { TableReport } from '@/components/charts/table'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
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
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/services/api'
import { formatDataset } from '@/utils/format-dataset'

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
  setFilterValues: Dispatch<SetStateAction<Record<string, any>>>
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
  customizations,
}: {
  display: string
  queryResult: Array<Record<string, any>>
  customizations: Record<string, any>
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

  const {
    datasets,
    labels: labelsKeys,
    indexAxis,
    xStacked,
    yStacked,
  } = customizations

  const { data, labels } = formatDataset({
    datasets,
    labelsKeys,
    queryResult,
    display,
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

  return reportTypes[display] || null
}

export default function Report() {
  const { reportId } = useParams<{ reportId: string }>()
  const router = useRouter()

  const [report, setReport] = useState<ReportType>()
  const [loading, setLoading] = useState(true)
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [queryResult, setQueryResult] = useState<Array<Record<string, any>>>([])
  const [loadingQueryResult, setLoadingQueryResult] = useState(true)

  const handleUpdateReportDisplay = useCallback(
    async (display: string) => {
      setLoadingQueryResult(true)

      const customizationsByDisplay: Record<string, Record<string, any>> = {
        bar: {
          datasets: [
            {
              label: Object.keys(queryResult[0])[0],
              data: Object.keys(queryResult[0])[1],
            },
          ],
          labels: Object.keys(queryResult[0])[0],
        },
        line: {
          datasets: [
            {
              label: Object.keys(queryResult[0])[0],
              data: Object.keys(queryResult[0])[1],
            },
          ],
          labels: Object.keys(queryResult[0])[0],
        },
        pie: {
          datasets: [
            {
              label: Object.keys(queryResult[0])[0],
              data: Object.keys(queryResult[0])[1],
            },
          ],
          labels: Object.keys(queryResult[0])[0],
        },
        doughnut: {
          datasets: [
            {
              label: Object.keys(queryResult[0])[0],
              data: Object.keys(queryResult[0])[1],
            },
          ],
          labels: Object.keys(queryResult[0])[0],
        },
        polararea: {
          datasets: [
            {
              label: Object.keys(queryResult[0])[0],
              data: Object.keys(queryResult[0])[1],
            },
          ],
          labels: Object.keys(queryResult[0])[0],
        },
      }

      const { data: updatedReport } = await api.put(`/report/${reportId}`, {
        display: display,
        ...(!report?.customizations &&
          customizationsByDisplay[display] && {
            customizations: customizationsByDisplay[display],
          }),
      })

      setReport(updatedReport)
      setLoadingQueryResult(false)
    },
    [queryResult, report?.customizations, reportId]
  )

  useEffect(() => {
    const fetchReport = async () => {
      const { data } = await api.get(`/report/${reportId}`)

      setReport(data)
      setLoading(false)
    }

    fetchReport()
  }, [reportId])

  const reportArguments = useMemo(
    () =>
      JSON.parse(
        report?.arguments === 'null' || !report?.arguments
          ? '{}'
          : report?.arguments
      ),
    [report?.arguments]
  )

  useEffect(() => {
    const fetchQueryResult = async () => {
      if (!report) return

      if (
        Object.entries(reportArguments).length !==
        Object.keys(filterValues).length
      ) {
        return
      }

      setLoadingQueryResult(true)

      const { data } = await api.post('/query', {
        dataSourceId: report.dataSourceId,
        query: report.query,
        arguments: Object.keys(filterValues).length ? filterValues : undefined,
      })

      setLoadingQueryResult(false)
      setQueryResult(data)
    }

    fetchQueryResult()
  }, [report, filterValues, reportArguments])

  return (
    <div className="bg-accent/50 w-full p-8 rounded-xl h-full flex flex-col gap-8">
      {loading ? (
        <Skeleton className="w-1/2 h-9" />
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
          <p className="font-semibold text-3xl">{report!.name}</p>
        </div>
      )}

      <div className="flex flex-col gap-4 h-full w-full overflow-auto">
        <div className="flex items-center justify-between">
          {loading ? (
            <Skeleton className="w-1/2 h-9" />
          ) : Object.entries(reportArguments).length > 0 ? (
            <div className="flex gap-4">
              {Object.entries(reportArguments).map(([key, value]: any) => (
                <RenderFilter
                  key={key}
                  name={key}
                  type={value}
                  filterValues={filterValues}
                  setFilterValues={setFilterValues}
                />
              ))}
            </div>
          ) : (
            <div />
          )}
          <ReportTypePicker
            handleUpdateReportDisplay={handleUpdateReportDisplay}
          />
        </div>

        {loading || loadingQueryResult ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <RenderReport
            display={report!.display}
            queryResult={queryResult}
            customizations={JSON.parse(report?.customizations || '{}')}
          />
        )}
      </div>
    </div>
  )
}
