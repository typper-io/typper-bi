'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import Link from 'next/link'

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

export interface SelectDataSourceComboboxProps {
  data: { label: string; value: string }[]
  emptyLabel: string
  placeholder: string
  value: string
  setValue: (value: string) => void
  id?: string
}

export function SelectDataSourceCombobox({
  data,
  emptyLabel,
  placeholder,
  value,
  setValue,
  id,
}: SelectDataSourceComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const valuePlaceholder = React.useMemo(() => {
    if (value)
      if (data.find((data) => data.value === value)?.label) {
        return data.find((data) => data.value === value)?.label
      }

    return placeholder
  }, [data, placeholder, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild id={id}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-fit justify-between truncate min-w-[200px]"
        >
          <p>{valuePlaceholder}</p>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0 min-w-[200px]">
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
            <Link href="/app/data-source/type">
              <CommandItem className="cursor-pointer gap-2">
                <Plus size={16} />
                Add new
              </CommandItem>
            </Link>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
