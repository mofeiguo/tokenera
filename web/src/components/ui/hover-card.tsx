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
'use client'

import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import type { ReactNode } from 'react'

import { hasAsChild, mergeRenderChild } from '@/components/ui/compose-as-child'
import { cn } from '@/lib/utils'

function HoverCard({
  delay,
  closeDelay,
  openDelay,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root> & {
  delay?: number
  closeDelay?: number
}) {
  return (
    <HoverCardPrimitive.Root
      data-slot='hover-card'
      openDelay={openDelay ?? delay}
      closeDelay={closeDelay}
      {...props}
    />
  )
}

function HoverCardTrigger({
  asChild,
  render,
  children,
  delay: _delay,
  closeDelay: _closeDelay,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger> & {
  render?: ReactNode
  delay?: number
  closeDelay?: number
}) {
  return (
    <HoverCardPrimitive.Trigger
      data-slot='hover-card-trigger'
      asChild={hasAsChild(asChild, render)}
      {...props}
    >
      {mergeRenderChild(render, children)}
    </HoverCardPrimitive.Trigger>
  )
}

function HoverCardContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal data-slot='hover-card-portal'>
      <HoverCardPrimitive.Content
        data-slot='hover-card-content'
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-lg p-2.5 text-sm shadow-md outline-hidden',
          className
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
