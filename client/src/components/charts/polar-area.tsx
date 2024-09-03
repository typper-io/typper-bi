import {
  Chart as ChartJS,
  ArcElement,
  RadialLinearScale,
  PolarAreaController,
} from 'chart.js'
import { useTheme } from 'next-themes'
import React from 'react'
import { PolarArea } from 'react-chartjs-2'

import { cn } from '@/lib/utils'
import { PolarAreaDataset } from '@/interfaces/dataset'
import { Caption } from '@/components/charts/components/caption'
import { getChartToolConfig } from '@/utils/get-chart-tool-config'

ChartJS.register(RadialLinearScale, ArcElement, PolarAreaController)

export interface PolarAreaChartProps extends React.ComponentProps<'div'> {
  data: PolarAreaDataset
  labels: Array<string>
  hideCaption?: boolean
}

export const PolarAreaChart = React.forwardRef<
  HTMLDivElement,
  PolarAreaChartProps
>(({ data: datasets, labels, hideCaption, className, ...props }, ref) => {
  const { theme } = useTheme()

  const data: React.ComponentProps<typeof PolarArea>['data'] = {
    labels,
    datasets,
  }

  const options: React.ComponentProps<typeof PolarArea>['options'] = {
    plugins: {
      legend: {
        display: false,
      },
    },
    maintainAspectRatio: false,
    scales: {
      r: {
        ticks: {
          color:
            theme === 'dark' ? 'hsla(215, 20%, 65%)' : 'hsla(215, 16%, 47%)',
          backdropColor: 'transparent',
        },
        grid: {
          color:
            theme === 'dark'
              ? 'hsla(215, 20%, 65%, 0.2)'
              : 'hsla(215, 16%, 47%, 0.2)',
        },
      },
    },
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
        <Caption
          datasets={datasets}
          labels={labels}
          hideCaption={hideCaption}
        />

        <div className="relative h-full w-full px-4 py-2 overflow-hidden">
          <PolarArea data={data} options={options} />
        </div>
      </div>
    </div>
  )
})

PolarAreaChart.displayName = 'PolarAreaChart'
