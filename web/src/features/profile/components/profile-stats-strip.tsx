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
import { Activity, BarChart3, WalletCards } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconBadge, type IconBadgeTone } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCompactNumber, formatQuota } from '@/lib/format'
import { Link } from '@/lib/router'

import type { UserProfile } from '../types'

interface ProfileStatsStripProps {
  profile: UserProfile | null
  loading: boolean
}

export function ProfileStatsStrip(props: ProfileStatsStripProps) {
  const { t } = useTranslation()

  if (props.loading) {
    return (
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:rounded-lg sm:border'>
        {['balance', 'usage', 'requests'].map((key) => (
          <div key={key} className='min-w-0 rounded-lg border px-3 py-3 sm:rounded-none sm:border-0 sm:px-5 sm:py-4'>
            <Skeleton className='h-3.5 w-20' />
            <Skeleton className='mt-2 h-7 w-28' />
            <Skeleton className='mt-1.5 h-3.5 w-24' />
          </div>
        ))}
      </div>
    )
  }

  if (!props.profile) return null

  const stats: {
    label: string
    value: string
    description: string
    icon: typeof WalletCards
    tone: IconBadgeTone
    href?: string
  }[] = [
    {
      label: t('Current Balance'),
      value: formatQuota(props.profile.quota),
      description: t('Remaining quota'),
      icon: WalletCards,
      tone: 'success',
      href: '/wallet',
    },
    {
      label: t('Total Usage'),
      value: formatQuota(props.profile.used_quota),
      description: t('Total consumed quota'),
      icon: BarChart3,
      tone: 'info',
    },
    {
      label: t('API Requests'),
      value: formatCompactNumber(props.profile.request_count),
      description: t('Total requests made'),
      icon: Activity,
      tone: 'chart-4',
    },
  ]

  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:rounded-lg sm:border'>
      {stats.map((item) => {
        const content = (
          <>
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
          </>
        )

        if (item.href) {
          return (
            <Link
              key={item.label}
              to={item.href}
              className='hover:bg-muted/40 focus-visible:ring-ring min-w-0 rounded-lg border px-3 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none sm:rounded-none sm:border-0 sm:px-5 sm:py-4'
            >
              {content}
            </Link>
          )
        }

        return (
          <div
            key={item.label}
            className='min-w-0 rounded-lg border px-3 py-3 sm:rounded-none sm:border-0 sm:px-5 sm:py-4'
          >
            {content}
          </div>
        )
      })}
    </div>
  )
}
