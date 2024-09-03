import { Code } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { SaveReport } from '@/components/save-report-button'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatNumber } from '@/utils/format-labels'

export interface MessageNumberReportProps {
  data: number
  name: string
  description: string
  dataSourceId: string
  threadId: string
  query: string
}

export const MessageNumberReport: React.FC<MessageNumberReportProps> = ({
  data: dataset,
  dataSourceId,
  description,
  name,
  query,
  threadId,
}) => {
  return (
    <div className="w-full flex flex-col gap-4">
      <Card className="bg-accent/50 rounded-lg max-h-[300px]">
        <div className="px-4 py-3 flex gap-2 justify-between items-center bg-accent rounded-t-lg">
          <p className="font-semibold text-lg leading-7">{name}</p>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="h-fit w-full items-center justify-center text-8xl font-semibold px-4">
              <p className="truncate">{formatNumber(dataset || 0)}</p>
            </TooltipTrigger>

            <TooltipContent>
              <p>{dataset}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Card>
      <div className="flex gap-4">
        <SaveReport
          dataSourceId={dataSourceId}
          name={name}
          description={description}
          threadId={threadId}
          display={'number'}
          query={query}
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
