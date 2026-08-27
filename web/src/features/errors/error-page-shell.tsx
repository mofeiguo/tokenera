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

type ErrorPageShellProps = {
  status?: number
  title: string
  description: ReactNode
  actions?: ReactNode
  detail?: ReactNode
  minimal?: boolean
  className?: string
}

export function ErrorPageShell(props: ErrorPageShellProps) {
  return (
    <main
      className={cn(
        'bg-background text-foreground grid min-h-svh place-items-center px-4 py-12',
        props.className
      )}
    >
      <section className='w-full max-w-xl'>
        {!props.minimal && props.status && (
          <p className='text-muted-foreground border-border mb-6 border-b pb-4 font-mono text-sm tabular-nums'>
            HTTP {props.status}
          </p>
        )}
        <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
          {props.title}
        </h1>
        <div className='text-muted-foreground mt-4 max-w-lg text-base leading-7'>
          {props.description}
        </div>
        {props.detail && (
          <div className='text-muted-foreground mt-3 text-sm'>
            {props.detail}
          </div>
        )}
        {!props.minimal && props.actions && (
          <div className='mt-8 flex flex-wrap gap-3'>{props.actions}</div>
        )}
      </section>
    </main>
  )
}
