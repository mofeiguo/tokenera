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

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useQuery } from '@/lib/query'
import { ROLE } from '@/lib/roles'
import { Link } from '@/lib/router'
import { useAuthStore } from '@/stores/auth-store'

import { getChannelOps } from '../api'
import { ChannelIconSettings } from './channel-icons'
import { ChannelsPrimaryButtons } from './channels-primary-buttons'

export function ChannelsPageHeader() {
  const { t } = useTranslation()
  const isRoot = useAuthStore(
    (state) => state.auth.user?.role === ROLE.SUPER_ADMIN
  )
  const channelOpsQuery = useQuery({
    queryKey: ['channel-ops'],
    queryFn: getChannelOps,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
  const retryTimes = channelOpsQuery.data?.data?.retry_times
  const retryLabel =
    typeof retryTimes === 'number' ? `${t('Max Retries')}: ${retryTimes}` : null

  let retryBadge = null
  if (retryLabel) {
    retryBadge = isRoot ? (
      <Tooltip>
        <TooltipTrigger
          render={
            <Badge
              variant='outline'
              className='shrink-0 cursor-pointer'
              aria-label={t('Retry Settings')}
              render={
                <Link
                  to='/system-settings/models/$section'
                  params={{ section: 'routing-reliability' }}
                />
              }
            />
          }
        >
          <span>{retryLabel}</span>
          <ChannelIconSettings data-icon='inline-end' className='size-3.5' />
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('Retry Settings')}</p>
        </TooltipContent>
      </Tooltip>
    ) : (
      <Badge variant='outline' className='shrink-0'>
        {retryLabel}
      </Badge>
    )
  }

  return (
    <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
      <div className='min-w-0'>
        <div className='flex min-w-0 flex-wrap items-center gap-2'>
          <h1 className='text-3xl font-bold tracking-tight'>{t('Channels')}</h1>
          {retryBadge}
        </div>
        <p className='text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed md:text-base'>
          {t('Configure upstream providers and routing.')}
        </p>
      </div>
      <div className='shrink-0'>
        <ChannelsPrimaryButtons />
      </div>
    </div>
  )
}
