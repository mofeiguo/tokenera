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
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { DASHBOARD_PANEL_FRAME } from './panel-surface'

interface PanelWrapperProps {
  title: ReactNode
  description?: ReactNode
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
  height?: string
  className?: string
  contentClassName?: string
  headerActions?: ReactNode
  children?: ReactNode
}

function PanelHeader(props: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  const heading = (
    <div className='flex min-w-0 flex-col gap-0.5'>
      <div className='text-sm leading-snug font-semibold'>{props.title}</div>
      {props.description != null && (
        <div className='text-muted-foreground text-xs leading-relaxed'>
          {props.description}
        </div>
      )}
    </div>
  )

  return (
    <div className='border-border/70 border-b px-3 py-2.5 sm:px-4 sm:py-3'>
      {props.actions != null ? (
        <div className='flex items-start justify-between gap-2'>
          {heading}
          <div className='shrink-0'>{props.actions}</div>
        </div>
      ) : (
        heading
      )}
    </div>
  )
}

export function PanelWrapper(props: PanelWrapperProps) {
  const { t } = useTranslation()
  const resolvedEmptyMessage = props.emptyMessage ?? t('No data available')
  const height = props.height ?? 'h-64'
  const frameClassName = cn(DASHBOARD_PANEL_FRAME, props.className)

  if (props.loading) {
    return (
      <div className={frameClassName} aria-busy='true'>
        <PanelHeader title={props.title} description={props.description} />
        <div className={cn('p-3 sm:p-4', props.contentClassName)}>
          <Skeleton className={cn('w-full rounded-lg', height)} />
        </div>
      </div>
    )
  }

  if (props.empty) {
    return (
      <div className={frameClassName}>
        <PanelHeader title={props.title} description={props.description} />
        <div
          className={cn(
            'text-muted-foreground flex items-center justify-center px-4 text-sm',
            height,
            props.contentClassName
          )}
          role='status'
        >
          {resolvedEmptyMessage}
        </div>
      </div>
    )
  }

  return (
    <div className={frameClassName}>
      <PanelHeader
        title={props.title}
        description={props.description}
        actions={props.headerActions}
      />
      <div className={cn('p-3 sm:p-4', props.contentClassName)}>
        {props.children}
      </div>
    </div>
  )
}
