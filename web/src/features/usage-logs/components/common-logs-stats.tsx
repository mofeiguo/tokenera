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
import { Activity, BarChart3, Gauge } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconBadge, type IconBadgeTone } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatLogQuota } from '@/lib/format'
import { useQuery } from '@/lib/query'
import { getRouteApi } from '@/lib/router'

import { getLogStats, getUserLogStats } from '../api'
import { DEFAULT_LOG_STATS } from '../constants'
import { buildApiParams } from '../lib/utils'
import { useLogsViewScope, useUsageLogsContext } from './usage-logs-provider'

const route = getRouteApi('/_authenticated/usage-logs/$section')

export function CommonLogsStats() {
  const { t } = useTranslation()
  const { isAdminView: isAdmin } = useLogsViewScope()
  const searchParams = route.useSearch()
  const { sensitiveVisible } = useUsageLogsContext()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['usage-logs-stats', isAdmin, searchParams],
    queryFn: async () => {
      const params = buildApiParams({
        page: 1,
        pageSize: 1,
        searchParams,
        columnFilters: [],
        isAdmin,
      })

      const result = isAdmin
        ? await getLogStats(params)
        : await getUserLogStats(params)

      return result.success
        ? result.data || DEFAULT_LOG_STATS
        : DEFAULT_LOG_STATS
    },
    placeholderData: (previousData) => previousData,
  })

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:rounded-xl sm:border'>
        {['usage', 'rpm', 'tpm'].map((key) => (
          <div
            key={key}
            className='min-w-0 rounded-xl border px-3 py-3 sm:rounded-none sm:border-0 sm:px-5 sm:py-4'
          >
            <Skeleton className='h-3.5 w-20' />
            <Skeleton className='mt-2 h-7 w-28' />
            <Skeleton className='mt-1.5 h-3.5 w-24' />
          </div>
        ))}
      </div>
    )
  }

  const items: {
    label: string
    value: string | number
    description: string
    icon: typeof BarChart3
    tone: IconBadgeTone
  }[] = [
    {
      label: t('Usage'),
      value: sensitiveVisible ? formatLogQuota(stats?.quota || 0) : '••••',
      description: t('Quota consumed in selected range'),
      icon: BarChart3,
      tone: 'info',
    },
    {
      label: t('RPM'),
      value: stats?.rpm || 0,
      description: t('Requests per minute'),
      icon: Activity,
      tone: 'chart-4',
    },
    {
      label: t('TPM'),
      value: stats?.tpm || 0,
      description: t('Tokens per minute'),
      icon: Gauge,
      tone: 'chart-2',
    },
  ]

  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:rounded-xl sm:border'>
      {items.map((item) => (
        <div
          key={item.label}
          className='min-w-0 rounded-xl border px-3 py-3 sm:rounded-none sm:border-0 sm:px-5 sm:py-4'
        >
          <div className='flex items-center gap-2'>
            <IconBadge tone={item.tone} size='stat'>
              <item.icon />
            </IconBadge>
            <div className='text-muted-foreground truncate text-xs font-medium tracking-wider uppercase'>
              {item.label}
            </div>
          </div>
          <div className='text-foreground mt-1.5 truncate font-mono text-lg font-bold tracking-tight tabular-nums sm:mt-2 sm:text-2xl'>
            {item.value}
          </div>
          <div className='text-muted-foreground/60 mt-1 text-xs'>
            {item.description}
          </div>
        </div>
      ))}
    </div>
  )
}
