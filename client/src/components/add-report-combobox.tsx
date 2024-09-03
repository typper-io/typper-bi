'use client'

import * as React from 'react'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface AddReportComboboxProps {
  data: { label: string; value: string }[]
  emptyLabel?: string
  placeholder?: string
  value: string
  setValue: (value: string) => void
  icon: React.ReactNode
  disabled?: boolean
}

export function AddReportCombobox({
  data,
  emptyLabel,
  placeholder,
  value,
  setValue,
  icon,
  disabled,
}: AddReportComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-fit justify-between truncate gap-2"
        >
          {icon}
          {value
            ? data.find((data) => data.value === value)?.label
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandEmpty>{emptyLabel}</CommandEmpty>
          <CommandGroup>
            {data.map((data) => (
              <CommandItem
                key={data.value}
                value={data.value}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? '' : currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === data.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {data.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
