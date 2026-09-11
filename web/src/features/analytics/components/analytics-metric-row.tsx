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
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import type { AnalyticsMetricItem } from '../types'
import { analyticsCardClass } from './analytics-styles'

type AnalyticsMetricRowProps = {
  isLoading?: boolean
  items: AnalyticsMetricItem[]
}

export function AnalyticsMetricRow(props: AnalyticsMetricRowProps) {
  return (
    <div
      className={cn(
        'grid min-w-0 gap-3',
        props.items.length > 4
          ? 'grid-cols-2 xl:grid-cols-6'
          : 'grid-cols-2 xl:grid-cols-4'
      )}
    >
      {props.items.map((item) => (
        <div
          className={cn(
            analyticsCardClass,
            'flex h-[140px] min-w-0 flex-col px-6 py-5'
          )}
          key={item.label}
        >
          <div className='truncate text-[13px] text-[#666666] dark:text-muted-foreground'>
            {item.label}
          </div>
          {props.isLoading ? (
            <Skeleton className='mt-auto h-8 w-24' />
          ) : (
            <div className='mt-auto text-[26px] leading-none font-semibold tracking-tight break-all text-[#111111] tabular-nums dark:text-foreground'>
              {item.value ?? '—'}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
