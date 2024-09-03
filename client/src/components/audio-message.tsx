import { Check, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export const AudioMessage = () => {
  const [percentage, setPercentage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPercentage((percentage) => {
        if (percentage === 100) {
          clearInterval(interval)
          return 100
        }

        return percentage + 1
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-accent/50 py-3 px-4 flex gap-2 items-center rounded-md">
      <div
        className={cn(
          'bg-primary/10 py-1 px-2 flex gap-2 items-center rounded-sm',
          {
            '!bg-[#22C55E1A]': percentage === 100,
          }
        )}
      >
        {percentage === 100 ? (
          <Check size={16} className="text-[#22C55E]" />
        ) : (
          <Loader2 size={16} className="animate-spin text-primary" />
        )}
        <p
          className={cn('text-primary text-base leading-7', {
            '!text-[#22C55E]': percentage === 100,
          })}
        >
          {percentage === 100 ? 'Done' : `${percentage}%`}
        </p>
      </div>

      <p className="text-base leading-7">
        {percentage === 100
          ? 'Transcribed audio'
          : 'Transcribing your audio...'}
      </p>
    </div>
  )
}
