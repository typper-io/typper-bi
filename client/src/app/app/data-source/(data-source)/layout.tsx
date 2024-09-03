import { DataSourceStepHeader } from '@/app/app/data-source/(data-source)/components/data-source-step-header'
import { Title } from '@/app/app/data-source/(data-source)/components/title'

export default function NewDataSourceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-accent/50 rounded-xl p-8 flex flex-col gap-8 h-full overflow-hidden">
      <Title />

      <div className="h-full flex flex-col gap-4 overflow-hidden">
        <DataSourceStepHeader />

        {children}
      </div>
    </div>
  )
}
