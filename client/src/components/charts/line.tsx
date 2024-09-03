import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
} from 'chart.js'
import React from 'react'
import { Line } from 'react-chartjs-2'

import { cn } from '@/lib/utils'
import { LineDataset } from '@/interfaces/dataset'
import { Caption } from '@/components/charts/components/caption'
import { getChartToolConfig } from '@/utils/get-chart-tool-config'
import { useTheme } from 'next-themes'

ChartJS.register(PointElement, LineElement, Filler, CategoryScale, LinearScale)

export interface LineChartProps extends React.ComponentProps<'div'> {
  data: LineDataset
  labels: Array<string>
}

export const LineChart = React.forwardRef<HTMLDivElement, LineChartProps>(
  ({ data: datasets, labels, className, ...props }, ref) => {
    const { theme } = useTheme()

    const data: React.ComponentProps<typeof Line>['data'] = {
      labels,
      datasets,
    }

    const options: React.ComponentProps<typeof Line>['options'] = {
      plugins: {
        legend: {
          display: false,
        },
      },
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
        },
      },
      elements: {
        line: {
          tension: 0.4,
        },
      },
      ...getChartToolConfig({ theme }),
      // responsive: true,
      maintainAspectRatio: false,
    }

    return (
      <div
        ref={ref}
        className={cn(
          'bg-accent/50 rounded-lg w-full h-full border relative overflow-hidden',
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
            <Line data={data} options={options} />
          </div>
        </div>
      </div>
    )
  }
)

LineChart.displayName = 'LineChart'
