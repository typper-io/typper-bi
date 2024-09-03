import React from 'react'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatNumber } from '@/utils/format-labels'

export interface NumberReportProps extends React.ComponentProps<'div'> {
  data: number
}

export const NumberReport = React.forwardRef<HTMLDivElement, NumberReportProps>(
  ({ data: dataset, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-accent/50 rounded-lg w-full h-full border relative p-4"
        {...props}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="w-full h-full items-center justify-center text-8xl font-semibold">
              <p className="truncate">{formatNumber(dataset || 0)}</p>
            </TooltipTrigger>

            <TooltipContent>
              <p>{dataset || 0}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }
)

NumberReport.displayName = 'NumberReport'
