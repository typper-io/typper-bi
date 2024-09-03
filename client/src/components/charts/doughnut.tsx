import { Chart as ChartJS, ArcElement } from 'chart.js'
import React from 'react'
import { Doughnut } from 'react-chartjs-2'

import { cn } from '@/lib/utils'
import { DoughnutDataset } from '@/interfaces/dataset'
import { Caption } from '@/components/charts/components/caption'
import { useTheme } from 'next-themes'
import { getChartToolConfig } from '@/utils/get-chart-tool-config'

ChartJS.register(ArcElement)

export interface DoughnutChartProps extends React.ComponentProps<'div'> {
  data: DoughnutDataset
  labels: Array<string>
  hideLegend?: boolean
}

export const DoughnutChart = React.forwardRef<
  HTMLDivElement,
  DoughnutChartProps
>(({ data: datasets, labels, hideLegend, className, ...props }, ref) => {
  const { theme } = useTheme()

  const data: React.ComponentProps<typeof Doughnut>['data'] = {
    labels,
    datasets,
  }

  const options: React.ComponentProps<typeof Doughnut>['options'] = {
    plugins: {
      legend: {
        display: false,
      },
    },
    maintainAspectRatio: false,
    ...getChartToolConfig({ theme }),
    // responsive: true,
  }

  return (
    <div
      ref={ref}
      className={cn(
        'bg-accent/50 border rounded-lg h-full w-full overflow-hidden',
        className
      )}
      {...props}
    >
      <div className="w-full relative h-full overflow-hidden flex flex-col">
        <Caption datasets={datasets} labels={labels} />

        <div className="relative h-full w-full px-4 py-2 overflow-hidden">
          <Doughnut data={data} options={options} />
        </div>
      </div>
    </div>
  )
})

DoughnutChart.displayName = 'DoughnutChart'
