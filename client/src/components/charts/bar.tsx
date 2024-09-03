import React from 'react'
import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  LineController,
  BarController,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'

import { cn } from '@/lib/utils'
import { BarDataset } from '@/interfaces/dataset'
import { Caption } from '@/components/charts/components/caption'
import { getChartToolConfig } from '@/utils/get-chart-tool-config'
import { useTheme } from 'next-themes'

ChartJS.register(
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  LineController,
  BarController
)

export interface BarChartProps extends React.ComponentProps<'div'> {
  data: BarDataset
  xStacked?: boolean
  yStacked?: boolean
  labels: Array<string>
  indexAxis?: 'x' | 'y'
}

export const BarChart = React.forwardRef<HTMLDivElement, BarChartProps>(
  (
    {
      data: datasets,
      labels,
      xStacked,
      yStacked,
      indexAxis,
      className,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme()

    const data: React.ComponentProps<typeof Chart>['data'] = {
      labels: labels,
      datasets,
    }

    const options: React.ComponentProps<typeof Chart>['options'] = {
      scales: {
        x: {
          border: {
            display: false,
          },
          grid: {
            display: false,
          },
          ticks: {
            display: true,
            color:
              theme === 'dark' ? 'hsla(215, 20%, 65%)' : 'hsla(215, 16%, 47%)',
          },
          ...(xStacked && { stacked: true }),
        },
        y: {
          border: {
            display: false,
          },
          grid: {
            color:
              theme === 'dark'
                ? 'hsla(215, 20%, 65%, 0.20)'
                : 'hsla(215, 16%, 47%, 0.20)',
          },
          ticks: {
            display: true,
            count: 6,
            color:
              theme === 'dark' ? 'hsla(215, 20%, 65%)' : 'hsla(215, 16%, 47%)',
          },
          ...(yStacked && { stacked: true }),
        },
      },
      ...getChartToolConfig({ theme }),
      indexAxis,
      maintainAspectRatio: false,
      // responsive: true,
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative bg-accent/50 rounded-lg w-full h-full border overflow-hidden',
          className
        )}
        {...props}
      >
        <div className="w-full relative h-full overflow-hidden flex flex-col">
          <Caption
            datasets={datasets}
            labels={datasets.map((dataset) => dataset.label || '')}
          />

          <div className="relative h-full w-full px-4 py-2 overflow-hidden">
            <Chart type="bar" data={data} options={options} />
          </div>
        </div>
      </div>
    )
  }
)

BarChart.displayName = 'BarChart'
