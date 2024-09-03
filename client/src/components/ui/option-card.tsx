import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { fontMontserrat } from '@/fonts/font-montserrat'
import { Check } from 'lucide-react'

const optionCardVariants = cva(
  'inline-flex whitespace-nowrap justify-between rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full gap-4 p-6 cursor-pointer items-center',
  {
    variants: {
      variant: {
        default: 'bg-accent/50 text-foreground hover:bg-accent',
        selected: 'bg-primary text-primary-foreground hover:bg-primary/80',
        disabled: 'bg-accent/50 opacity-50 text-foreground ',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface OptionCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof optionCardVariants> {
  selected?: Array<string>
  setSelected?: React.Dispatch<React.SetStateAction<Array<string>>>
  value?: string
}

const OptionCard = React.forwardRef<HTMLDivElement, OptionCardProps>(
  (
    {
      className,
      variant: variantProps,
      children,
      selected,
      setSelected,
      value,
      ...props
    },
    ref
  ) => {
    const toggleSelected = React.useCallback(
      (value?: string) => {
        if (!setSelected || !selected || !value) return

        if (selected.includes(value)) {
          setSelected(selected.filter((v) => v !== value))
        } else {
          setSelected([...selected, value])
        }
      },
      [selected, setSelected]
    )

    const variant = React.useMemo(() => {
      if (variantProps || !selected || !value) return variantProps

      return selected.includes(value) ? 'selected' : 'default'
    }, [selected, value, variantProps])

    return (
      <div
        onClick={() => toggleSelected(value)}
        className={cn(
          optionCardVariants({ variant, className }),
          fontMontserrat.variable
        )}
        ref={ref}
        {...props}
      >
        <div className="flex items-center gap-4">{children}</div>
        {variant === 'selected' && <Check size={16} />}
      </div>
    )
  }
)

OptionCard.displayName = 'OptionCard'

export { OptionCard, optionCardVariants }
