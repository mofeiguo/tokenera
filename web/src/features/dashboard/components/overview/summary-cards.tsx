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
import {
  Activity,
  CircleDollarSign,
  CreditCard,
  Crown,
  Flame,
  Hash,
  Layers,
  ShieldCheck,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getUserQuotaDates } from '@/features/dashboard/api'
import type { QuotaDataItem } from '@/features/dashboard/types'
import { formatCompactNumber, formatNumber, formatQuota } from '@/lib/format'
import { useQuery } from '@/lib/query'
import { computeTimeRange } from '@/lib/time'
import { useAuthStore } from '@/stores/auth-store'

import { MetricCard } from './metric-card'

const SUMMARY_SPARKLINE_BUCKETS = 12

type SummarySparklineKey = 'balance' | 'usage' | 'requests'

function getBucketIndex(
  timestamp: number,
  start: number,
  end: number,
  bucketCount: number
): number {
  if (end <= start) return 0
  const ratio = (timestamp - start) / (end - start)
  return Math.min(bucketCount - 1, Math.max(0, Math.floor(ratio * bucketCount)))
}

function asQuotaItems(data: unknown): QuotaDataItem[] {
  return Array.isArray(data) ? data : []
}

function buildSummarySparklines(
  data: QuotaDataItem[],
  currentBalance: number,
  start: number,
  end: number
): Record<SummarySparklineKey, number[]> {
  const usage = Array.from({ length: SUMMARY_SPARKLINE_BUCKETS }, () => 0)
  const requests = Array.from({ length: SUMMARY_SPARKLINE_BUCKETS }, () => 0)

  for (const item of data) {
    const timestamp = Number(item.created_at) || start
    const index = getBucketIndex(
      timestamp,
      start,
      end,
      SUMMARY_SPARKLINE_BUCKETS
    )
    usage[index] += Number(item.quota) || 0
    requests[index] += Number(item.count) || 0
  }

  let balance = currentBalance
  const balanceTrend = Array.from(
    { length: SUMMARY_SPARKLINE_BUCKETS },
    () => 0
  )

  for (let index = SUMMARY_SPARKLINE_BUCKETS - 1; index >= 0; index--) {
    balanceTrend[index] = Math.max(0, balance)
    balance += usage[index]
  }

  return {
    balance: balanceTrend,
    usage,
    requests,
  }
}

function getRunwayDays(
  remainQuota: number,
  recentUsage: number
): number | null {
  if (remainQuota <= 0 || recentUsage <= 0) return null
  const days = remainQuota / recentUsage
  if (!Number.isFinite(days)) return null
  return days
}

type HealthLevel = 'healthy' | 'caution' | 'critical'

function getHealthLevel(remainQuota: number, recentUsage: number): HealthLevel {
  if (remainQuota <= 0) return 'critical'
  const days = getRunwayDays(remainQuota, recentUsage)
  if (days !== null && days < 3) return 'caution'
  return 'healthy'
}

function getTopModel(data: QuotaDataItem[]): {
  name: string
  quota: number
} | null {
  const totals = new Map<string, number>()
  for (const item of data) {
    const name = item.model_name?.trim()
    if (!name) continue
    totals.set(name, (totals.get(name) ?? 0) + (Number(item.quota) || 0))
  }
  let top: { name: string; quota: number } | null = null
  for (const [name, quota] of totals) {
    if (!top || quota > top.quota) {
      top = { name, quota }
    }
  }
  return top
}

function TokenStatSub(props: { loading?: boolean; sub?: string }) {
  if (props.loading) {
    return <Skeleton className='mt-1.5 h-3 w-24' />
  }
  if (!props.sub) return null
  return (
    <p className='text-muted-foreground mt-0.5 truncate text-xs'>{props.sub}</p>
  )
}

function TokenStat(props: {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  loading?: boolean
}) {
  const Icon = props.icon
  return (
    <div className='min-w-0 lg:px-6 lg:first:pl-0 lg:last:pr-0'>
      <div className='text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase'>
        <Icon className='size-3.5' />
        <span className='truncate'>{props.label}</span>
      </div>
      {props.loading ? (
        <Skeleton className='mt-2 h-6 w-20' />
      ) : (
        <p className='mt-1.5 truncate text-lg font-semibold tabular-nums'>
          {props.value}
        </p>
      )}
      <TokenStatSub loading={props.loading} sub={props.sub} />
    </div>
  )
}

export function SummaryCards() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)

  const summaryTimeRange = useMemo(() => computeTimeRange(1), [])
  const remainQuota = Number(user?.quota ?? 0)
  const usedQuota = Number(user?.used_quota ?? 0)
  const requestCount = Number(user?.request_count ?? 0)

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

  const quotaItems = asQuotaItems(usageTrendQuery.data?.data)
  const loading = usageTrendQuery.isLoading && !user

  const sparklineData = useMemo(
    () =>
      buildSummarySparklines(
        quotaItems,
        remainQuota,
        summaryTimeRange.start_timestamp,
        summaryTimeRange.end_timestamp
      ),
    [
      quotaItems,
      remainQuota,
      summaryTimeRange.end_timestamp,
      summaryTimeRange.start_timestamp,
    ]
  )

  const recentUsage = useMemo(
    () =>
      quotaItems.reduce((total, item) => total + (Number(item.quota) || 0), 0),
    [quotaItems]
  )
  const recentTokens = useMemo(
    () =>
      quotaItems.reduce(
        (total, item) => total + (Number(item.token_used) || 0),
        0
      ),
    [quotaItems]
  )
  const recentRequests = useMemo(
    () =>
      quotaItems.reduce((total, item) => total + (Number(item.count) || 0), 0),
    [quotaItems]
  )
  const topModel = useMemo(() => getTopModel(quotaItems), [quotaItems])

  const healthLevel = getHealthLevel(remainQuota, recentUsage)
  const runwayDays = getRunwayDays(remainQuota, recentUsage)
  let runwayDisplay: string
  if (runwayDays !== null) {
    if (runwayDays < 1) {
      runwayDisplay = t('Less than 1 day left')
    } else if (runwayDays > 999) {
      runwayDisplay = `999+ ${t('days')}`
    } else {
      runwayDisplay = `~${formatNumber(Math.floor(runwayDays))} ${t('days')}`
    }
  } else if (remainQuota <= 0) {
    runwayDisplay = t('Balance depleted')
  } else {
    runwayDisplay = t('No recent usage')
  }

  const runwayAccent =
    healthLevel === 'critical' || healthLevel === 'caution' ? 'purple' : 'green'
  const RunwayIcon =
    healthLevel === 'critical' || healthLevel === 'caution'
      ? TrendingDown
      : ShieldCheck

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4'>
        <MetricCard
          label={t('Credit remaining')}
          value={formatQuota(remainQuota)}
          subtitle={t('Available balance')}
          icon={<CreditCard className='size-4' />}
          accent='blue'
          trend={sparklineData.balance}
          loading={loading}
        />
        <MetricCard
          label={t('Total Requests')}
          value={formatNumber(requestCount)}
          subtitle={t('Total requests made')}
          icon={<Activity className='size-4' />}
          accent='purple'
          trend={sparklineData.requests}
          loading={loading}
        />
        <MetricCard
          label={t('Total Spend')}
          value={formatQuota(usedQuota)}
          subtitle={t('Total consumed')}
          icon={<CircleDollarSign className='size-4' />}
          accent='blue'
          trend={sparklineData.usage}
          loading={loading}
        />
        <MetricCard
          label={t('Runway')}
          value={runwayDisplay}
          subtitle={`${t('Last 24h usage')}: ${formatQuota(recentUsage)}`}
          icon={<RunwayIcon className='size-4' />}
          accent={runwayAccent}
          loading={loading}
        />
      </div>

      <Card size='sm' className='py-5'>
        <CardContent className='lg:divide-border/60 grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4 lg:gap-0 lg:divide-x'>
          <TokenStat
            icon={Flame}
            label={t('Last 24h usage')}
            value={formatQuota(recentUsage)}
            sub={t('Consumed in the last 24 hours')}
            loading={usageTrendQuery.isLoading}
          />
          <TokenStat
            icon={Layers}
            label={t('Total Tokens')}
            value={formatCompactNumber(recentTokens)}
            sub={t('Statistical tokens')}
            loading={usageTrendQuery.isLoading}
          />
          <TokenStat
            icon={Hash}
            label={t('Requests')}
            value={formatNumber(recentRequests)}
            sub={t('Daily request volume')}
            loading={usageTrendQuery.isLoading}
          />
          <TokenStat
            icon={Crown}
            label={t('Top model')}
            value={topModel?.name ?? '—'}
            sub={topModel ? formatQuota(topModel.quota) : t('No usage yet')}
            loading={usageTrendQuery.isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
