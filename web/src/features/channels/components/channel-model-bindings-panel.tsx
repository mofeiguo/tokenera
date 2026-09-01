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
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { useQuery } from '@/lib/query'

import { getChannelModelBindings } from '../api'
import { sortChannelBindings } from '../lib/channel-model-bindings'

type ChannelModelBindingsPanelProps = {
  channelId?: number
}

export function ChannelModelBindingsPanel({
  channelId,
}: ChannelModelBindingsPanelProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['channels', channelId, 'model-bindings'],
    queryFn: () => getChannelModelBindings(channelId || 0),
    enabled: Boolean(channelId),
  })
  const bindings = useMemo(
    () => sortChannelBindings(data?.data ?? []),
    [data?.data]
  )

  if (!channelId) {
    return (
      <p className='text-muted-foreground text-sm'>
        {t('Create the channel first, then bind it from the Models page.')}
      </p>
    )
  }
  if (isLoading) {
    return (
      <p className='text-muted-foreground text-sm'>
        {t('Loading bindings...')}
      </p>
    )
  }
  if (bindings.length === 0) {
    return (
      <p className='text-muted-foreground text-sm'>
        {t('No catalog bindings on this channel.')}
      </p>
    )
  }

  return (
    <ul className='space-y-2'>
      {bindings.map((binding) => (
        <li
          key={binding.id ?? `${binding.model_name}-${binding.channel_id}`}
          className='flex items-center justify-between gap-3 rounded-md border px-3 py-2'
        >
          <div className='min-w-0'>
            <div className='truncate text-sm font-medium'>
              {binding.model_name || t('Unknown model')}
            </div>
            {binding.upstream_model &&
            binding.upstream_model !== binding.model_name ? (
              <div className='text-muted-foreground truncate text-xs'>
                {t('Channel model')}: {binding.upstream_model}
              </div>
            ) : null}
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='outline'>
              {t('Priority')} {binding.priority ?? 0}
            </Badge>
            <Badge variant='outline'>
              {t('Weight')} {binding.weight ?? 0}
            </Badge>
            {!binding.enabled ? (
              <Badge variant='outline'>{t('Disabled')}</Badge>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}
