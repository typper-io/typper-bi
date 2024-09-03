import { Code, Download } from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useRef } from 'react'

import { BarChart } from '@/components/charts/bar'
import { SaveReport } from '@/components/save-report-button'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BarDataset } from '@/interfaces/dataset'

export interface MessageBarChartProps {
  data: BarDataset
  labels: Array<string>
  name: string
  description: string
  dataSourceId: string
  threadId: string
  query: string
  indexAxis?: 'x' | 'y'
  xStacked?: boolean
  yStacked?: boolean
  formattedDatasets: Record<string, any>
  labelsKey: Array<string>
}

export const MessageBarChart: React.FC<MessageBarChartProps> = ({
  data: datasets,
  labels,
  dataSourceId,
  description,
  name,
  query,
  threadId,
  indexAxis,
  xStacked,
  yStacked,
  formattedDatasets,
  labelsKey,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)

  const downloadChart = useCallback(() => {
    if (!chartContainerRef.current) return
    const canvas = chartContainerRef.current.getElementsByTagName('canvas')[0]

    const image = canvas.toDataURL('image/png')

    const a = document.createElement('a')
    a.href = image
    a.download = `${name}.png`
    a.click()
  }, [name])

  return (
    <div className="w-full flex flex-col gap-4">
      <Card className="bg-accent/50 rounded-lg max-h-[300px]">
        <div className="px-4 py-3 flex gap-2 justify-between items-center bg-accent rounded-t-lg">
          <p className="font-semibold text-lg leading-7">{name}</p>

          <Button variant="secondary" onClick={downloadChart}>
            <Download size={16} />
          </Button>
        </div>

        <BarChart
          indexAxis={indexAxis}
          ref={chartContainerRef}
          data={datasets}
          labels={labels}
          xStacked={xStacked}
          yStacked={yStacked}
          className="rounded-t-none rounded-b-lg bg-transparent border-none"
        />
      </Card>
      <div className="flex gap-4">
        <SaveReport
          dataSourceId={dataSourceId}
          name={name}
          description={description}
          threadId={threadId}
          display={'bar'}
          query={query}
          customizations={{
            indexAxis,
            xStacked,
            yStacked,
            datasets: formattedDatasets,
            labels: labelsKey,
          }}
        />
        <Link
          className="flex gap-4"
          href={`/app/query?dataSourceId=${dataSourceId}&query=${encodeURI(
            query
          )}`}
        >
          <Button variant="secondary" className="gap-2">
            <Code size={16} />
            Open Query Runner
          </Button>
        </Link>
      </div>
    </div>
  )
}
