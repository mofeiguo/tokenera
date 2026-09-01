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
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { getChannel } from '@/features/channels/api'
import { parseModelsList } from '@/features/channels/lib/channel-utils'
import type { Channel } from '@/features/channels/types'
import { useQuery } from '@/lib/query'

import { resolveBindingUpstreamModel } from '../lib/binding-upstream'
import type { ModelChannelBinding } from '../types'

type ModelChannelBindingsEditorProps = {
  bindings: ModelChannelBinding[]
  channels: Channel[]
  catalogModelName?: string
  disabled?: boolean
  onChange: (bindings: ModelChannelBinding[]) => void
}

export function ModelChannelBindingsEditor({
  bindings,
  channels,
  catalogModelName = '',
  disabled = false,
  onChange,
}: ModelChannelBindingsEditorProps) {
  const { t } = useTranslation()
  const [channelNamesById] = useState<Record<number, string>>(() => {
    const names: Record<number, string> = {}
    for (const binding of bindings) {
      const name = binding.channel_name?.trim()
      if (binding.channel_id > 0 && name) {
        names[binding.channel_id] = name
      }
    }
    return names
  })

  const updateBinding = (
    index: number,
    patch: Partial<ModelChannelBinding>
  ) => {
    onChange(
      bindings.map((binding, bindingIndex) =>
        bindingIndex === index ? { ...binding, ...patch } : binding
      )
    )
  }

  const channelSelectItems = useMemo(() => {
    const labels = new Map<string, string>()
    for (const channel of channels) {
      const name = channel.name.trim()
      if (name !== '') {
        labels.set(String(channel.id), name)
      }
    }
    for (const [channelId, name] of Object.entries(channelNamesById)) {
      if (name.trim() !== '' && !labels.has(channelId)) {
        labels.set(channelId, name.trim())
      }
    }
    for (const binding of bindings) {
      const name = binding.channel_name?.trim()
      if (binding.channel_id > 0 && name) {
        const key = String(binding.channel_id)
        if (!labels.has(key)) {
          labels.set(key, name)
        }
      }
    }
    return [...labels.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [bindings, channelNamesById, channels])

  return (
    <div className='space-y-3'>
      {bindings.length === 0 ? (
        <div className='text-muted-foreground rounded-md border border-dashed px-4 py-5 text-center text-sm'>
          {t('No channel model bindings configured')}
        </div>
      ) : null}

      {bindings.length > 0 ? (
        <p className='text-muted-foreground text-xs'>
          {t(
            'Priority is tried first (higher first). Weight splits traffic among bindings with the same priority.'
          )}
        </p>
      ) : null}

      {bindings.map((binding, index) => {
        const selectedChannelIds = new Set(
          bindings
            .filter((_, bindingIndex) => bindingIndex !== index)
            .map((item) => item.channel_id)
            .filter((channelId) => channelId > 0)
        )

        return (
          <div
            key={binding.id ?? `${binding.channel_id}-${index}`}
            className='space-y-3 rounded-md border p-3'
          >
            <div className='grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_6rem_6rem_auto_auto]'>
              <div className='space-y-1'>
                <Label className='text-muted-foreground text-xs font-normal'>
                  {t('Channel')}
                </Label>
                <Select
                  items={channelSelectItems}
                  value={
                    binding.channel_id > 0 ? String(binding.channel_id) : null
                  }
                  onValueChange={(value) => {
                    const selected = channelSelectItems.find(
                      (item) => item.value === value
                    )
                    updateBinding(index, {
                      channel_id: Number(value),
                      channel_name: selected?.label,
                      upstream_model: '',
                    })
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger className='w-full' aria-label={t('Channel')}>
                    <SelectValue placeholder={t('Select channel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {channelSelectItems.map((channel) => (
                      <SelectItem
                        key={channel.value}
                        value={channel.value}
                        disabled={selectedChannelIds.has(Number(channel.value))}
                      >
                        {channel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1'>
                <Label
                  htmlFor={`binding-priority-${index}`}
                  className='text-muted-foreground text-xs font-normal'
                >
                  {t('Priority')}
                </Label>
                <Input
                  id={`binding-priority-${index}`}
                  type='number'
                  value={binding.priority ?? 0}
                  onChange={(event) => {
                    const next = Number.parseInt(event.target.value, 10)
                    updateBinding(index, {
                      priority: Number.isNaN(next) ? 0 : next,
                    })
                  }}
                  aria-label={t('Priority')}
                  title={t(
                    'Priority is tried first (higher first). Weight splits traffic among bindings with the same priority.'
                  )}
                  disabled={disabled}
                />
              </div>

              <div className='space-y-1'>
                <Label
                  htmlFor={`binding-weight-${index}`}
                  className='text-muted-foreground text-xs font-normal'
                >
                  {t('Weight')}
                </Label>
                <Input
                  id={`binding-weight-${index}`}
                  type='number'
                  min={0}
                  value={binding.weight ?? 0}
                  onChange={(event) => {
                    const next = Number.parseInt(event.target.value, 10)
                    updateBinding(index, {
                      weight: Number.isNaN(next) || next < 0 ? 0 : next,
                    })
                  }}
                  aria-label={t('Weight')}
                  title={t(
                    'Priority is tried first (higher first). Weight splits traffic among bindings with the same priority.'
                  )}
                  disabled={disabled}
                />
              </div>

              <div className='flex items-center gap-2'>
                <Switch
                  checked={binding.enabled}
                  onCheckedChange={(enabled) =>
                    updateBinding(index, { enabled })
                  }
                  aria-label={t('Enable binding')}
                  disabled={disabled}
                />
              </div>

              <Button
                type='button'
                variant='ghost'
                size='icon'
                aria-label={t('Delete binding')}
                disabled={disabled}
                onClick={() =>
                  onChange(
                    bindings.filter((_, bindingIndex) => bindingIndex !== index)
                  )
                }
              >
                <Trash2 className='size-4' />
              </Button>
            </div>

            <ChannelBindingModelSelect
              channelId={binding.channel_id}
              catalogModelName={catalogModelName}
              value={binding.upstream_model}
              disabled={disabled}
              onChange={(upstreamModel) =>
                updateBinding(index, { upstream_model: upstreamModel })
              }
            />
          </div>
        )
      })}

      <Button
        type='button'
        variant='outline'
        size='sm'
        disabled={disabled}
        onClick={() =>
          onChange([
            ...bindings,
            {
              channel_id: 0,
              enabled: true,
              priority: 0,
              weight: 0,
            },
          ])
        }
      >
        <Plus className='mr-2 size-4' />
        {t('Add channel binding')}
      </Button>
    </div>
  )
}

function ChannelBindingModelSelect({
  channelId,
  catalogModelName,
  value,
  disabled,
  onChange,
}: {
  channelId: number
  catalogModelName: string
  value?: string
  disabled?: boolean
  onChange: (upstreamModel: string) => void
}) {
  const { t } = useTranslation()
  const { data } = useQuery({
    queryKey: ['channels', channelId, 'restricted-models'],
    queryFn: () => getChannel(channelId),
    enabled: channelId > 0,
  })
  const models = parseModelsList(data?.data?.models ?? '')
  const modelsKey = models.join(',')
  const items = models.map((modelName) => ({
    value: modelName,
    label: modelName,
  }))

  useEffect(() => {
    if (channelId <= 0 || modelsKey === '') {
      return
    }
    const channelModels = modelsKey.split(',')
    if (value && channelModels.includes(value)) {
      return
    }
    const next = resolveBindingUpstreamModel(
      channelModels,
      catalogModelName,
      value
    )
    if (next && next !== value) {
      onChange(next)
    }
  }, [catalogModelName, channelId, modelsKey, onChange, value])

  return (
    <div className='space-y-1'>
      <Label className='text-muted-foreground text-xs font-normal'>
        {t('Channel model')}
      </Label>
      <Select
        items={items}
        value={value || null}
        onValueChange={(nextValue) => {
          if (nextValue) {
            onChange(nextValue)
          }
        }}
        disabled={disabled || channelId <= 0}
      >
        <SelectTrigger className='w-full' aria-label={t('Channel model')}>
          <SelectValue placeholder={t('Select channel model')} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
