import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import React from 'react'
import { Pie } from 'react-chartjs-2'

import { cn } from '@/lib/utils'
import { Caption } from '@/components/charts/components/caption'
import { PieDataset } from '@/interfaces/dataset'
import { getChartToolConfig } from '@/utils/get-chart-tool-config'
import { useTheme } from 'next-themes'

ChartJS.register(ArcElement, Tooltip, Legend)

export interface PieChartProps extends React.ComponentProps<'div'> {
  data: PieDataset
  labels: Array<string>
  hideLegend?: boolean
}

export const PieChart = React.forwardRef<HTMLDivElement, PieChartProps>(
  ({ data: datasets, labels, hideLegend, className, ...props }, ref) => {
    const { theme } = useTheme()

    const data: React.ComponentProps<typeof Pie>['data'] = {
      labels,
      datasets,
    }

    const options: React.ComponentProps<typeof Pie>['options'] = {
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
            <Pie data={data} options={options} />
          </div>
        </div>
      </div>
    )
  }
)

PieChart.displayName = 'PieChart'
