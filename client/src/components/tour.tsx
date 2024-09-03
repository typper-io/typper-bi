'use client'

import { Button } from '@/components/ui/button'
import { useLocalStorage } from '@/hooks/use-localstorage'
import { X } from 'lucide-react'
import { ElementType, Suspense, useMemo } from 'react'
import Joyride, { TooltipRenderProps } from 'react-joyride'

export const Tour = (
  props: Partial<React.ComponentProps<typeof Joyride>> & {
    id: string
  }
) => {
  const [showTour, setShowTour] = useLocalStorage<boolean>(props.id, true)

  const Tooltip: ElementType<TooltipRenderProps> = ({
    continuous,
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    tooltipProps,
    size,
    isLastStep,
  }) => {
    const { left, right, top, bottom } = useMemo(() => {
      const tops: Record<string, number | undefined | string> = {
        right: '50%',
        left: '50%',
        'left-start': 20,
        'right-start': 20,
      }

      const lefts: Record<string, number | undefined | string> = {
        right: -10,
        'right-start': -10,
        'right-end': -10,
        'top-start': 20,
        top: '50%',
      }

      const rights: Record<string, number | undefined | string> = {
        left: -10,
        'left-start': -10,
        'left-end': -10,
        'top-end': 20,
      }

      const bottoms: Record<string, number | undefined | string> = {
        top: -10,
        'top-start': -10,
        'top-end': -10,
        'left-end': 20,
        'right-end': 20,
      }

      return {
        top: tops[props.steps![index].placement!],
        left: lefts[props.steps![index].placement!],
        right: rights[props.steps![index].placement!],
        bottom: bottoms[props.steps![index].placement!],
      }
    }, [index])

    return (
      <div
        className="p-4 rounded-xl bg-muted gap-4 flex flex-col w-[467px] relative"
        {...tooltipProps}
      >
        <div
          className="h-4 w-4 bg-primary/10 p-1 rounded-full flex items-center justify-center absolute z-[999]"
          style={{ left, right, top, bottom }}
        >
          <div className="bg-primary rounded-full h-full w-full" />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            {step.title && <p className="font-bold">{step.title}</p>}

            <Button variant="ghost" className="p-0 h-8 w-8" {...closeProps}>
              <X size={16} />
            </Button>
          </div>

          <p>{step.content}</p>
        </div>

        <div className="flex items-center gap-4 justify-between">
          <p className="text-muted-foreground">
            {index + 1}/{size}
          </p>

          <div>
            {index > 0 && (
              <Button variant="ghost" {...backProps}>
                Previous
              </Button>
            )}
            {continuous && (
              <Button {...primaryProps}>{isLastStep ? 'Done' : 'Next'}</Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={null}>
      <Joyride
        {...props}
        run={showTour}
        tooltipComponent={Tooltip}
        continuous
        callback={({ status }) => {
          if (status === 'finished' || status === 'skipped') {
            setShowTour(false)
          }
        }}
        styles={{
          options: {
            arrowColor: 'transparent',
          },
          beaconInner: {
            background: 'hsla(var(--primary))',
            border: 'none',
          },
          beaconOuter: {
            background: 'hsla(var(--primary), 0.1)',
            border: 'none',
          },
        }}
      />
    </Suspense>
  )
}
