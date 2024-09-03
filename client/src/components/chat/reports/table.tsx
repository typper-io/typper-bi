import { Code, Download } from 'lucide-react'
import Link from 'next/link'
import { useCallback } from 'react'

import { SaveReport } from '@/components/save-report-button'
import { Button } from '@/components/ui/button'
import { TableReport } from '@/components/charts/table'

export interface TableReportProps {
  data: Array<Record<string, string>>
  name: string
  description: string
  dataSourceId: string
  threadId?: string
  query: string
}

export const ChatTableReport = ({
  data,
  dataSourceId,
  description,
  name,
  query,
  threadId,
}: TableReportProps) => {
  const tableHeads = Object.keys(data[0] || {})
  const rows = data.map((row) => Object.values(row))

  const handleDownloadAsCSV = useCallback(() => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        tableHeads.join(',') +
          '\n' +
          rows.map((row) => row.join(',')).join('\n')
      )

    const link = document.createElement('a')
    link.setAttribute('href', csvContent)
    link.setAttribute('download', `${name}.csv`)
    document.body.appendChild(link)

    link.click()
  }, [name, rows, tableHeads])

  return (
    <div className="flex flex-col gap-4 self-start w-full relative">
      <div className="border-input bg-accent/50 w-full border border-solid max-h-[300px] rounded-lg overflow-hidden relative flex flex-col">
        <div className="px-4 py-3 flex gap-2 justify-between items-center bg-accent rounded-t-lg">
          <p className="font-semibold text-lg leading-7">{name}</p>
          <div className="cursor-pointer" onClick={handleDownloadAsCSV}>
            <Download size={16} />
          </div>
        </div>

        <div className="relative h-full w-full overflow-auto">
          <TableReport data={data} />
        </div>
      </div>

      <div className="flex gap-4">
        <SaveReport
          dataSourceId={dataSourceId}
          name={name}
          description={description}
          threadId={threadId}
          display={'table'}
          query={query}
        />
        <Link
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
