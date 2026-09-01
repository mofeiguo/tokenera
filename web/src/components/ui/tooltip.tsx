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
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

import { hasAsChild, mergeRenderChild } from '@/components/ui/compose-as-child'
import { cn } from '@/lib/utils'

function TooltipProvider({
  delay = 0,
  delayDuration,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider> & {
  delay?: number
}) {
  return (
    <TooltipPrimitive.Provider
      data-slot='tooltip-provider'
      delayDuration={delayDuration ?? delay}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot='tooltip' {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  asChild,
  render,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger> & {
  render?: ReactNode
}) {
  return (
    <TooltipPrimitive.Trigger
      data-slot='tooltip-trigger'
      asChild={hasAsChild(asChild, render)}
      {...props}
    >
      {mergeRenderChild(render, children)}
    </TooltipPrimitive.Trigger>
  )
}

function TooltipContent({
  className,
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot='tooltip-content'
        sideOffset={sideOffset}
        className={cn(
          'bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 overflow-hidden rounded-md px-3 py-1.5 text-xs has-data-[slot=kbd]:pr-1.5',
          className
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
