import { CirclesThree } from '@phosphor-icons/react'
import {
  BarChart4Icon,
  PieChartIcon,
  LineChartIcon,
  BinaryIcon,
  Donut,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export const ReportTypePicker = ({
  handleUpdateReportDisplay,
}: {
  handleUpdateReportDisplay: (display: string) => Promise<void>
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="secondary" className="gap-2 self-end">
          <BarChart4Icon size={16} /> Report Type
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          className="gap-2"
          onClick={() => handleUpdateReportDisplay('table')}
        >
          <PieChartIcon size={16} /> Table
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={() => handleUpdateReportDisplay('bar')}
        >
          <BarChart4Icon size={16} /> Bar
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={() => handleUpdateReportDisplay('line')}
        >
          <LineChartIcon size={16} /> Line
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={() => handleUpdateReportDisplay('pie')}
        >
          <PieChartIcon size={16} /> Pie
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={() => handleUpdateReportDisplay('number')}
        >
          <BinaryIcon size={16} /> Number
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={() => handleUpdateReportDisplay('doughnut')}
        >
          <Donut size={16} /> Doughnut
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={() => handleUpdateReportDisplay('polararea')}
        >
          <CirclesThree size={16} /> Polar Area
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
