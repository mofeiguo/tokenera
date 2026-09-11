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
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { analyticsCardClass } from '@/features/analytics/components/analytics-styles'
import { formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'

import type { UserWalletData } from '../types'

type WalletStatsCardProps = {
  loading?: boolean
  user: UserWalletData | null
}

export function WalletStatsCard(props: WalletStatsCardProps) {
  const { t } = useTranslation()
  const items = [
    {
      label: t('Current Balance'),
      value: formatQuota(props.user?.quota ?? 0),
    },
    {
      label: t('Total Usage'),
      value: formatQuota(props.user?.used_quota ?? 0),
    },
    {
      label: t('API Requests'),
      value: (props.user?.request_count ?? 0).toLocaleString(),
    },
  ]

  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
      {items.map((item) => (
        <div
          className={cn(
            analyticsCardClass,
            'flex h-[120px] min-w-0 flex-col px-6 py-5'
          )}
          key={item.label}
        >
          <div className='truncate text-[13px] text-[#666666] dark:text-muted-foreground'>
            {item.label}
          </div>
          {props.loading ? (
            <Skeleton className='mt-auto h-8 w-24' />
          ) : (
            <div className='mt-auto text-[26px] leading-none font-semibold tracking-tight break-all text-[#111111] tabular-nums dark:text-foreground'>
              {item.value}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
