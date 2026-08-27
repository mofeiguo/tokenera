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
import { ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useQuery } from '@/lib/query'
import { cn } from '@/lib/utils'

import { getChannelModelBindings } from '../api'
import {
  groupChannelBindingsByUpstream,
  type ChannelBindingGroup,
} from '../lib/channel-model-bindings'

type ChannelModelBindingsPanelProps = {
  channelId?: number
}

function ChannelBindingGroupRow({
  group,
  defaultOpen,
}: {
  group: ChannelBindingGroup
  defaultOpen: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(defaultOpen)
  const enabledCount = group.bindings.filter(
    (binding) => binding.enabled
  ).length

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className='rounded-md border'
    >
      <CollapsibleTrigger
        className={cn(
          'hover:bg-muted/40 flex w-full items-center gap-3 px-3 py-3 text-left transition-colors',
          open && 'bg-muted/20'
        )}
      >
        <ChevronRight
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-transform',
            open && 'rotate-90'
          )}
          aria-hidden='true'
        />
        <div className='min-w-0 flex-1'>
          <div className='font-mono text-sm'>{group.upstreamModel}</div>
          <div className='text-muted-foreground text-xs'>
            {t('Upstream model')}
          </div>
        </div>
        <Badge variant='outline' className='shrink-0'>
          {t('{{count}} public models', { count: group.bindings.length })}
        </Badge>
        {enabledCount < group.bindings.length ? (
          <Badge variant='secondary' className='shrink-0'>
            {t('{{count}} enabled', { count: enabledCount })}
          </Badge>
        ) : null}
      </CollapsibleTrigger>
      <CollapsibleContent className='border-t px-3 py-2'>
        <ul className='space-y-2'>
          {group.bindings.map((binding) => (
            <li
              key={
                binding.id ?? `${binding.model_name}-${binding.upstream_model}`
              }
              className='flex items-center justify-between gap-3 rounded-md px-2 py-1.5'
            >
              <div className='min-w-0'>
                <div className='truncate text-sm font-medium'>
                  {binding.model_name || t('Unknown model')}
                </div>
                <div className='text-muted-foreground text-xs'>
                  {t('Public model')}
                </div>
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
      </CollapsibleContent>
    </Collapsible>
  )
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
  const bindings = data?.data
  const groups = useMemo(
    () => groupChannelBindingsByUpstream(bindings ?? []),
    [bindings]
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
  if (groups.length === 0) {
    return (
      <p className='text-muted-foreground text-sm'>
        {t('No catalog bindings on this channel.')}
      </p>
    )
  }

  return (
    <div className='space-y-2'>
      {groups.map((group) => (
        <ChannelBindingGroupRow
          key={group.upstreamModel}
          group={group}
          defaultOpen={group.bindings.length === 1}
        />
      ))}
    </div>
  )
}
