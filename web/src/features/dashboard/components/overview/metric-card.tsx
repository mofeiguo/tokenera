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
import { useId, type ReactNode } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const ACCENT_COLORS = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  green: '#10b981',
} as const

const ACCENT_ICON_CLASS = {
  blue: 'border-sky-500/30 bg-sky-500/10 text-sky-500 dark:text-sky-400',
  purple:
    'border-violet-500/30 bg-violet-500/10 text-violet-500 dark:text-violet-400',
  green:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
} as const

type MetricAccent = keyof typeof ACCENT_COLORS

function MetricSubtitle(props: { loading?: boolean; subtitle?: string }) {
  if (props.loading) {
    return <Skeleton className='mt-2 h-3 w-32' />
  }
  if (!props.subtitle) return null
  return <p className='text-muted-foreground mt-1 text-xs'>{props.subtitle}</p>
}

function Sparkline(props: { trend: number[]; color: string }) {
  const gradientId = `metric-spark-${useId().replaceAll(':', '')}`
  const values = props.trend.map((value) => Math.max(0, Number(value) || 0))
  const width = 160
  const height = 40
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min
  const points = values.map((value, index) => {
    const x =
      values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
    let normalized = 0.5
    if (range > 0) normalized = (value - min) / range
    else if (max > 0) normalized = 0.5
    const y = height - 4 - normalized * (height - 8)
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  })
  const linePath = points.join(' ')
  const lastX = values.length === 1 ? width / 2 : width
  const areaPath = `${linePath} L ${lastX} ${height} L 0 ${height} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio='none'
      className='size-full'
      aria-hidden='true'
    >
      <defs>
        <linearGradient id={gradientId} x1='0' x2='0' y1='0' y2='1'>
          <stop offset='5%' stopColor={props.color} stopOpacity='0.35' />
          <stop offset='95%' stopColor={props.color} stopOpacity='0.02' />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill='none'
        stroke={props.color}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.5'
        vectorEffect='non-scaling-stroke'
      />
    </svg>
  )
}

export function MetricCard(props: {
  label: string
  value: string
  subtitle?: string
  icon?: ReactNode
  accent?: MetricAccent
  trend?: number[]
  loading?: boolean
}) {
  const accent = props.accent ?? 'blue'
  const showTrend =
    !props.loading &&
    Boolean(props.trend?.length) &&
    (props.trend?.some((value) => value !== 0) ?? false)

  return (
    <div className='bg-card text-card-foreground border-border/60 relative flex flex-col justify-between overflow-hidden rounded-xl border shadow-sm'>
      <div className='flex items-start justify-between gap-3 p-4 pb-0 sm:p-5 sm:pb-0'>
        <div className='min-w-0 flex-1'>
          <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
            {props.label}
          </p>
          {props.loading ? (
            <Skeleton className='mt-2 h-7 w-24 sm:h-8' />
          ) : (
            <p className='mt-2 text-xl font-semibold break-all tabular-nums sm:text-2xl'>
              {props.value}
            </p>
          )}
          <MetricSubtitle loading={props.loading} subtitle={props.subtitle} />
        </div>
        {props.icon ? (
          <div
            className={cn(
              'hidden size-9 shrink-0 items-center justify-center rounded-full border text-xs sm:inline-flex',
              ACCENT_ICON_CLASS[accent]
            )}
          >
            {props.icon}
          </div>
        ) : null}
      </div>
      <div className={cn('h-10', !showTrend && 'h-4 sm:h-5')}>
        {showTrend && props.trend ? (
          <Sparkline trend={props.trend} color={ACCENT_COLORS[accent]} />
        ) : null}
      </div>
    </div>
  )
}
