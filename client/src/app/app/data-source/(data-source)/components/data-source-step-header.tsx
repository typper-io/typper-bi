'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

import { Progress } from '@/components/ui/progress'

export const DataSourceStepHeader = () => {
  const path = usePathname()

  const step = useMemo(() => path.split('/')[3], [path])

  const progress = useMemo(() => {
    const progressByStep: Record<string, number> = {
      type: 15,
      url: 30,
      schemas: 45,
      tables: 60,
      context: 75,
      success: 100,
    }

    return progressByStep[step]
  }, [step])

  const title = useMemo(() => {
    const titleByStep: Record<string, string> = {
      type: 'Data source type',
      url: 'Add data source connection',
      schemas: 'Used schemas',
      tables: 'Schemas verification',
      context: 'Context and additional information',
    }

    return titleByStep[step]
  }, [step])

  const stepNumber = useMemo(() => {
    const stepNumberByStep: Record<string, number> = {
      type: 1,
      url: 2,
      schemas: 3,
      tables: 4,
      context: 5,
    }

    return stepNumberByStep[step]
  }, [step])

  if (step === 'success') return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <div className="text-2xl font-semibold leading-7 flex items-center justify-center bg-muted/50 rounded-sm p-2 w-8 h-8">
          {stepNumber}
        </div>
        <p className="text-3xl leading-8 font-semibold">{title}</p>
      </div>

      <div className="flex py-2">
        <Progress className="w-full h-2" value={progress} />
      </div>
    </div>
  )
}
