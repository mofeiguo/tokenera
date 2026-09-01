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

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import type { BoundChannel } from '../types'

type BoundChannelsCellProps = {
  channels?: BoundChannel[]
}

export function BoundChannelsCell({ channels }: BoundChannelsCellProps) {
  const { t } = useTranslation()
  const items = channels ?? []

  if (items.length === 0) {
    return (
      <span className='text-muted-foreground text-xs'>{t('No bindings')}</span>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className='text-sm tabular-nums' />}>
        {t('{{count}} channel(s)', { count: items.length })}
      </TooltipTrigger>
      <TooltipContent
        side='top'
        className='max-h-48 max-w-[280px] overflow-y-auto'
      >
        <ul className='space-y-1'>
          {items.map((channel) => (
            <li
              key={channel.id}
              className={channel.enabled === false ? 'opacity-60' : undefined}
            >
              {channel.name}
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}
