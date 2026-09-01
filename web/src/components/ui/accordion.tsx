/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDownIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type AccordionRootProps = Omit<
  React.ComponentProps<typeof AccordionPrimitive.Root>,
  'type' | 'collapsible' | 'value' | 'defaultValue' | 'onValueChange'
> & {
  type?: 'single' | 'multiple'
  multiple?: boolean
  collapsible?: boolean
  className?: string
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[]) => void
}

function Accordion({
  type,
  collapsible,
  multiple,
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}: AccordionRootProps) {
  if (multiple || type === 'multiple') {
    return (
      <AccordionPrimitive.Root
        data-slot='accordion'
        type='multiple'
        className={cn('flex w-full flex-col', className)}
        {...(Array.isArray(value) ? { value } : {})}
        {...(Array.isArray(defaultValue) ? { defaultValue } : {})}
        onValueChange={(nextValue) => onValueChange?.(nextValue)}
        {...props}
      />
    )
  }

  return (
    <AccordionPrimitive.Root
      data-slot='accordion'
      type='single'
      collapsible={collapsible ?? true}
      className={cn('flex w-full flex-col', className)}
      {...(typeof value === 'string' ? { value } : {})}
      {...(typeof defaultValue === 'string' ? { defaultValue } : {})}
      onValueChange={(nextValue) => onValueChange?.(nextValue)}
      {...props}
    />
  )
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot='accordion-item'
      className={cn('border-b last:border-b-0', className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className='flex'>
      <AccordionPrimitive.Trigger
        data-slot='accordion-trigger'
        className={cn(
          'focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-semibold transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          size={16}
          data-slot='accordion-trigger-icon'
          className='pointer-events-none shrink-0 opacity-60 transition-transform duration-200'
          aria-hidden='true'
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot='accordion-content'
      className='data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm'
      {...props}
    >
      <div className={cn('pt-0 pb-4', className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
