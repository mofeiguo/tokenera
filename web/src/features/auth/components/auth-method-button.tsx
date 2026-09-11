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
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type AuthMethodButtonProps = {
  label: string
  icon?: ReactNode
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
}

export function AuthMethodButton(props: AuthMethodButtonProps) {
  return (
    <button
      type={props.type ?? 'button'}
      disabled={props.disabled}
      onClick={props.onClick}
      className={cn(
        'border-border bg-background text-foreground hover:border-foreground/40 flex h-10 w-full items-center justify-center gap-2 rounded-md border px-4 text-sm font-normal transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        props.className
      )}
    >
      {props.icon ? (
        <span className='flex size-4 shrink-0 items-center justify-center [&_svg]:size-4'>
          {props.icon}
        </span>
      ) : null}
      <span>{props.label}</span>
    </button>
  )
}
