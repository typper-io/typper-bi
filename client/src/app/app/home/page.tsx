'use client'

import { Chat } from '@phosphor-icons/react'
import {
  ArrowDown10,
  ArrowDownAZ,
  ArrowUp10,
  ArrowUpAZ,
  BarChart4,
} from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'

import { BarChart } from '@/components/charts/bar'
import { DoughnutChart } from '@/components/charts/doughnut'
import { LineChart } from '@/components/charts/line'
import { NumberReport } from '@/components/charts/number'
import { PieChart } from '@/components/charts/pie'
import { PolarAreaChart } from '@/components/charts/polar-area'
import { TableReport } from '@/components/charts/table'
import { Button } from '@/components/ui/button'
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

const RenderReport = ({
  query,
  display,
  dataSourceId,
  customizations,
}: {
  query: string
  display: string
  dataSourceId: string
  customizations: Record<string, any>
}) => {
  const [queryResult, setQueryResult] = useState<Array<Record<string, any>>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const getQueryResult = async () => {
      setLoading(true)

      const { data } = await api.post('/query', {
        dataSourceId: dataSourceId,
        query: query,
      })

      if (!data) {
        return setLoading(false)
      }

      setQueryResult(data)
      setLoading(false)
    }

    getQueryResult()
  }, [dataSourceId, display, query])

  if (loading) {
    return <Skeleton id="skeleton" className="w-full h-full" />
  }

  if (display === 'number') {
    return <NumberReport data={Object.values(queryResult[0] || {})?.[0]} />
  }

  if (display === 'table') {
    const tableData =
      queryResult?.map((result) => {
        Object.keys(result).forEach((key) => {
          if (typeof result[key] === 'object') {
            result[key] = JSON.stringify(result[key])
          }
        })

        return result
      }) || []

    return <TableReport data={tableData} />
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
    display,
    labelsKeys,
    queryResult,
  })

  const reportTypes: Record<string, ReactNode> = {
    pie: <PieChart labels={labels} data={data} hideLegend />,
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
    polararea: <PolarAreaChart data={data} labels={labels} hideCaption />,
    doughnut: <DoughnutChart data={data} labels={labels} hideLegend />,
  }

  return reportTypes[display]
}

export default function Home() {
  const [reports, setReports] = useState<Array<any>>([])
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState('ascending')

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)

      const { data } = await api.get(`/report?owner=true&max=6`)

      setReports(data)
      setLoading(false)
    }

    fetchReports()
  }, [])

  useEffect(() => {
    if (order === 'ascending') {
      setReports((oldReports) =>
        oldReports.sort((a, b) => a.name.localeCompare(b.name))
      )
    }

    if (order === 'descending') {
      setReports((oldReports) =>
        oldReports.sort((a, b) => b.name.localeCompare(a.name))
      )
    }

    if (order === 'most_recent') {
      setReports((oldReports) =>
        oldReports.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      )
    }

    if (order === 'oldest') {
      setReports((oldReports) =>
        oldReports.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      )
    }
  }, [order])

  return (
    <div className="bg-accent/50 h-full w-full p-8 rounded-xl gap-8 flex flex-col">
      <p className="font-semibold leading-9 text-3xl">Home</p>

      <div className="flex flex-col gap-4">
        <p className="font-semibold leading-8 text-2xl">
          What do you want to do?
        </p>
        <div className="gap-4 flex items-center">
          <Link
            href="/app/chat"
            className="rounded-md w-[240px] p-4 flex flex-col gap-4 items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <BarChart4 size={24} />
            <p>Create chart</p>
          </Link>

          <Link
            href="/app/chat"
            className="rounded-md w-[240px] p-4 flex flex-col gap-4 items-center justify-center bg-secondary hover:bg-secondary/80"
          >
            <Chat size={24} />
            <p>Chat with Typper AI</p>
          </Link>
        </div>
      </div>

      <div className="flex gap-4 flex-col h-full overflow-auto">
        <div className="flex w-full justify-between">
          <p className="font-semibold leading-8 text-2xl">Your reports</p>

          <Select
            onValueChange={(value) => {
              setOrder(value)
            }}
            value={order}
          >
            <SelectTrigger className="bg-transparent w-fit">
              <SelectValue placeholder="Order by" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectItem value="ascending">
                  <div className="gap-2 flex items-center">
                    <ArrowDownAZ size={16} />
                    Ascending
                  </div>
                </SelectItem>
                <SelectItem value="descending">
                  <div className="gap-2 flex items-center">
                    <ArrowUpAZ size={16} />
                    Descending
                  </div>
                </SelectItem>
                <SelectItem value="most_recent">
                  <div className="gap-2 flex items-center">
                    <ArrowDown10 size={16} />
                    Most recent
                  </div>
                </SelectItem>
                <SelectItem value="oldest">
                  <div className="gap-2 flex items-center">
                    <ArrowUp10 size={16} />
                    Oldest
                  </div>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {!loading && reports.length === 0 && (
          <div className="bg-accent/50 p-4 rounded-xl h-full w-full flex items-center justify-center flex-col gap-4">
            <p>The charts you create will appear here.</p>

            <Link href="/app/chat?message=Hi, I want to create a chart!">
              <Button variant="secondary" className="gap-2">
                <BarChart4 size={16} />
                Create report
              </Button>
            </Link>
          </div>
        )}

        {(loading || reports.length > 0) && (
          <div className="p-4 bg-accent/50 rounded-xl h-full w-full flex flex-wrap gap-4 overflow-auto content-start">
            {!loading &&
              reports.map((report) => {
                return (
                  <div
                    key={report.name}
                    className="flex-grow h-[240px] w-[361.995px] bg-accent/50 rounded-lg flex flex-col remove-child-border remove-child-bg border"
                  >
                    <p className="truncate max-w-full px-4 py-3 flex items-center">
                      {report.name}
                    </p>
                    <div className="p-2 w-full h-full overflow-auto">
                      <Link href={`/app/reports/${report.id}`}>
                        <RenderReport
                          query={report.query}
                          display={report.display}
                          dataSourceId={report.dataSourceId}
                          customizations={JSON.parse(
                            report?.customizations || '{}'
                          )}
                        />
                      </Link>
                    </div>
                  </div>
                )
              })}

            {loading && (
              <>
                <Skeleton className="flex-grow h-[240px] w-[361.995px]" />
                <Skeleton className="flex-grow h-[240px] w-[361.995px]" />
                <Skeleton className="flex-grow h-[240px] w-[361.995px]" />
                <Skeleton className="flex-grow h-[240px] w-[361.995px]" />
                <Skeleton className="flex-grow h-[240px] w-[361.995px]" />
                <Skeleton className="flex-grow h-[240px] w-[361.995px]" />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
