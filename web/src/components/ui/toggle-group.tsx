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
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { toggleVariants } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: 'horizontal' | 'vertical'
  }
>({
  size: 'default',
  variant: 'default',
  spacing: 0,
  orientation: 'horizontal',
})

type ToggleGroupProps = VariantProps<typeof toggleVariants> & {
  spacing?: number
  orientation?: 'horizontal' | 'vertical'
  multiple?: boolean
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string[] | string) => void
} & Omit<
    React.ComponentProps<typeof ToggleGroupPrimitive.Root>,
    'type' | 'value' | 'defaultValue' | 'onValueChange'
  > & {
    type?: 'single' | 'multiple'
  }

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  orientation = 'horizontal',
  children,
  type,
  multiple,
  value,
  defaultValue,
  onValueChange,
  ...props
}: ToggleGroupProps) {
  const resolvedType = multiple || type === 'multiple' ? 'multiple' : 'single'

  const sharedClassName = cn(
    'group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] rounded-lg data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch data-[size=sm]:rounded-md',
    className
  )
  const sharedStyle = { '--gap': spacing } as React.CSSProperties

  const content = (
    <ToggleGroupContext.Provider
      value={{ variant, size, spacing, orientation }}
    >
      {children}
    </ToggleGroupContext.Provider>
  )

  if (resolvedType === 'multiple') {
    const arrayValue = Array.isArray(value)
      ? value
      : value
        ? [value]
        : undefined
    const arrayDefault = Array.isArray(defaultValue)
      ? defaultValue
      : defaultValue
        ? [defaultValue]
        : undefined

    return (
      <ToggleGroupPrimitive.Root
        data-slot='toggle-group'
        data-variant={variant}
        data-size={size}
        data-spacing={spacing}
        data-orientation={orientation}
        type='multiple'
        value={arrayValue}
        defaultValue={arrayDefault}
        onValueChange={(nextValue) => onValueChange?.(nextValue)}
        style={sharedStyle}
        className={sharedClassName}
        {...props}
      >
        {content}
      </ToggleGroupPrimitive.Root>
    )
  }

  const stringValue = Array.isArray(value) ? value[0] : value
  const stringDefault = Array.isArray(defaultValue)
    ? defaultValue[0]
    : defaultValue

  return (
    <ToggleGroupPrimitive.Root
      data-slot='toggle-group'
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      type='single'
      value={stringValue}
      defaultValue={stringDefault}
      onValueChange={(nextValue) => {
        if (Array.isArray(value) || Array.isArray(defaultValue)) {
          onValueChange?.(nextValue ? [nextValue] : [])
          return
        }
        onValueChange?.(nextValue)
      }}
      style={sharedStyle}
      className={sharedClassName}
      {...props}
    >
      {content}
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant = 'default',
  size = 'default',
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      data-slot='toggle-group-item'
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        'shrink-0 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2 focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pr-1.5 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:pl-1.5',
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
