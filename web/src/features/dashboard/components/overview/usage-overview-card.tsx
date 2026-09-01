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
import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getUserQuotaDates } from '@/features/dashboard/api'
import type { QuotaDataItem } from '@/features/dashboard/types'
import { useQuery } from '@/lib/query'
import { computeTimeRange } from '@/lib/time'
import { cn } from '@/lib/utils'

const BUCKET_COUNT = 24

function asQuotaItems(data: unknown): QuotaDataItem[] {
  return Array.isArray(data) ? data : []
}

function buildSeries(
  data: QuotaDataItem[],
  start: number,
  end: number,
  metric: 'usage' | 'requests'
): number[] {
  const values = Array.from({ length: BUCKET_COUNT }, () => 0)
  if (end <= start) return values
  for (const item of data) {
    const timestamp = Number(item.created_at) || start
    const ratio = (timestamp - start) / (end - start)
    const index = Math.min(
      BUCKET_COUNT - 1,
      Math.max(0, Math.floor(ratio * BUCKET_COUNT))
    )
    values[index] +=
      metric === 'requests' ? Number(item.count) || 0 : Number(item.quota) || 0
  }
  return values
}

function UsageAreaChart(props: { values: number[] }) {
  const gradientId = `usage-area-${useId().replaceAll(':', '')}`
  const values = props.values.map((value) => Math.max(0, Number(value) || 0))
  const width = 640
  const height = 280
  const max = Math.max(...values, 0)
  const points = values.map((value, index) => {
    const x =
      values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
    const y = max <= 0 ? height - 8 : height - 8 - (value / max) * (height - 24)
    return { x, y }
  })
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  const last = points.at(-1)
  const first = points.at(0)
  if (!first || !last) return null
  const areaPath = `${linePath} L ${last.x} ${height} L ${first.x} ${height} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio='none'
      className='h-[220px] w-full sm:h-[280px]'
      aria-hidden='true'
    >
      <defs>
        <linearGradient id={gradientId} x1='0' x2='0' y1='0' y2='1'>
          <stop offset='5%' stopColor='#3b82f6' stopOpacity='0.35' />
          <stop offset='95%' stopColor='#3b82f6' stopOpacity='0.04' />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill='none'
        stroke='#3b82f6'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        vectorEffect='non-scaling-stroke'
      />
    </svg>
  )
}

function UsageOverviewBody(props: {
  loading: boolean
  hasData: boolean
  values: number[]
}) {
  const { t } = useTranslation()
  if (props.loading) {
    return <Skeleton className='h-[220px] w-full rounded-lg sm:h-[280px]' />
  }
  if (props.hasData) {
    return <UsageAreaChart values={props.values} />
  }
  return (
    <div className='text-muted-foreground flex h-[220px] items-center justify-center text-sm sm:h-[280px]'>
      {t('No activity data available')}
    </div>
  )
}

export function UsageOverviewCard(props: { className?: string }) {
  const { t } = useTranslation()
  const [metric, setMetric] = useState<'usage' | 'requests'>('usage')
  const summaryTimeRange = useMemo(() => computeTimeRange(1), [])

  const usageTrendQuery = useQuery({
    queryKey: [
      'dashboard',
      'overview',
      'summary-sparklines',
      summaryTimeRange.start_timestamp,
      summaryTimeRange.end_timestamp,
    ],
    queryFn: async () =>
      getUserQuotaDates({
        start_timestamp: summaryTimeRange.start_timestamp,
        end_timestamp: summaryTimeRange.end_timestamp,
        default_time: 'hour',
      }),
    staleTime: 60 * 1000,
  })

  const values = useMemo(
    () =>
      buildSeries(
        asQuotaItems(usageTrendQuery.data?.data),
        summaryTimeRange.start_timestamp,
        summaryTimeRange.end_timestamp,
        metric
      ),
    [
      metric,
      summaryTimeRange.end_timestamp,
      summaryTimeRange.start_timestamp,
      usageTrendQuery.data?.data,
    ]
  )
  const hasData = values.some((value) => value > 0)

  return (
    <Card className={props.className} size='sm'>
      <CardHeader>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <CardTitle>{t('Usage Overview')}</CardTitle>
            <CardDescription>
              {metric === 'requests'
                ? t('Daily request volume')
                : t('Usage over the last 24 hours')}
            </CardDescription>
          </div>
          <div className='border-border/60 bg-muted/40 inline-flex items-center rounded-lg border p-0.5'>
            {(['usage', 'requests'] as const).map((option) => (
              <button
                key={option}
                type='button'
                onClick={() => setMetric(option)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors',
                  metric === option
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {option === 'requests' ? t('Requests') : t('Usage')}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <UsageOverviewBody
          loading={usageTrendQuery.isLoading}
          hasData={hasData}
          values={values}
        />
      </CardContent>
    </Card>
  )
}
