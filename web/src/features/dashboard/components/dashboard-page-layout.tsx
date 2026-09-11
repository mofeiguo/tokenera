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

import { Main } from '@/components/layout/components/main'
import { cn } from '@/lib/utils'

type DashboardPageLayoutProps = {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  toolbar?: ReactNode
  children: ReactNode
}

export function DashboardPageLayout(props: DashboardPageLayoutProps) {
  return (
    <Main>
      <div className='flex min-h-0 flex-1 flex-col md:p-1'>
        <div
          className={cn(
            'bg-background flex min-h-0 flex-1 flex-col overflow-hidden',
            'md:rounded-2xl md:border md:border-border/60 md:shadow-[0_1px_4px_0_rgba(0,0,0,0.05)]'
          )}
        >
          <div className='border-border/60 shrink-0 border-b px-4 py-4 sm:px-6 sm:py-5'>
            <div className='flex flex-wrap items-start justify-between gap-x-4 gap-y-3'>
              <div className='min-w-0 flex-1'>
                <h1 className='text-foreground truncate text-xl font-semibold tracking-tight sm:text-2xl'>
                  {props.title}
                </h1>
                {props.description ? (
                  <p className='text-muted-foreground mt-1 text-sm leading-relaxed'>
                    {props.description}
                  </p>
                ) : null}
              </div>
              {props.actions ? (
                <div className='flex shrink-0 flex-wrap items-center justify-end gap-2'>
                  {props.actions}
                </div>
              ) : null}
            </div>
            {props.toolbar ? (
              <div className='mt-4 flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
                {props.toolbar}
              </div>
            ) : null}
          </div>

          <div className='min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6 sm:pb-6'>
            {props.children}
          </div>
        </div>
      </div>
    </Main>
  )
}
