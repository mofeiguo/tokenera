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
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import type { ReactNode } from 'react'

import { hasAsChild, mergeRenderChild } from '@/components/ui/compose-as-child'

function Collapsible({
  asChild,
  render,
  children,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root> & {
  render?: ReactNode
}) {
  return (
    <CollapsiblePrimitive.Root
      data-slot='collapsible'
      asChild={hasAsChild(asChild, render)}
      {...props}
    >
      {mergeRenderChild(render, children)}
    </CollapsiblePrimitive.Root>
  )
}

function CollapsibleTrigger({
  asChild,
  render,
  children,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger> & {
  render?: ReactNode
}) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot='collapsible-trigger'
      asChild={hasAsChild(asChild, render)}
      {...props}
    >
      {mergeRenderChild(render, children)}
    </CollapsiblePrimitive.CollapsibleTrigger>
  )
}

function CollapsibleContent({
  asChild,
  render,
  children,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent> & {
  render?: ReactNode
}) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot='collapsible-content'
      asChild={hasAsChild(asChild, render)}
      {...props}
    >
      {mergeRenderChild(render, children)}
    </CollapsiblePrimitive.CollapsibleContent>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
