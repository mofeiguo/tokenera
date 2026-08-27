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
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
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
import type { Channel } from '@/features/channels/types'

import type { ModelChannelBinding } from '../types'

type ModelChannelBindingsEditorProps = {
  bindings: ModelChannelBinding[]
  channels: Channel[]
  disabled?: boolean
  onChange: (bindings: ModelChannelBinding[]) => void
}

function parseModelsString(raw?: string | null): string[] {
  if (!raw) return []
  return [
    ...new Set(
      raw
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item !== '')
    ),
  ].sort((a, b) => a.localeCompare(b))
}

export function ModelChannelBindingsEditor({
  bindings,
  channels,
  disabled = false,
  onChange,
}: ModelChannelBindingsEditorProps) {
  const { t } = useTranslation()
  const [upstreamOptionsByChannel, setUpstreamOptionsByChannel] = useState<
    Record<number, string[]>
  >({})
  const [channelNamesById, setChannelNamesById] = useState<
    Record<number, string>
  >({})
  const [loadingChannelIds, setLoadingChannelIds] = useState<
    Record<number, boolean>
  >({})
  const loadedChannelIdsRef = useRef<Set<number>>(new Set())

  const channelIds = useMemo(
    () =>
      [
        ...new Set(
          bindings.map((binding) => binding.channel_id).filter((id) => id > 0)
        ),
      ].sort((a, b) => a - b),
    [bindings]
  )

  useEffect(() => {
    let cancelled = false

    const loadUpstreamModels = async (channelId: number) => {
      loadedChannelIdsRef.current.add(channelId)
      setLoadingChannelIds((current) => ({ ...current, [channelId]: true }))
      try {
        const channelResponse = await getChannel(channelId)
        const models = parseModelsString(channelResponse.data?.models)
        const channelName = channelResponse.data?.name?.trim()
        if (cancelled) return
        if (channelName) {
          setChannelNamesById((current) => ({
            ...current,
            [channelId]: channelName,
          }))
        }
        setUpstreamOptionsByChannel((current) => ({
          ...current,
          [channelId]: [...new Set(models)].sort((a, b) => a.localeCompare(b)),
        }))
      } catch {
        if (cancelled) return
        setUpstreamOptionsByChannel((current) => ({
          ...current,
          [channelId]: current[channelId] ?? [],
        }))
      } finally {
        if (!cancelled) {
          setLoadingChannelIds((current) => ({
            ...current,
            [channelId]: false,
          }))
        }
      }
    }

    for (const channelId of channelIds) {
      if (loadedChannelIdsRef.current.has(channelId)) {
        continue
      }
      void loadUpstreamModels(channelId)
    }

    return () => {
      cancelled = true
    }
  }, [channelIds])

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

  const bindingKey = (channelId: number, upstreamModel: string) =>
    `${channelId}\n${upstreamModel.trim()}`

  const getUpstreamPlaceholder = (channelId: number, loading: boolean) => {
    if (channelId <= 0) {
      return t('Select channel first')
    }
    if (loading) {
      return t('Loading models...')
    }
    return t('Select upstream model')
  }

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
        const selectedPairs = new Set(
          bindings
            .filter((_, bindingIndex) => bindingIndex !== index)
            .map((item) => bindingKey(item.channel_id, item.upstream_model))
        )
        const upstreamOptions = [
          ...new Set(
            [
              ...(upstreamOptionsByChannel[binding.channel_id] ?? []),
              binding.upstream_model,
            ]
              .map((item) => item.trim())
              .filter((item) => item !== '')
          ),
        ].sort((a, b) => a.localeCompare(b))

        return (
          <div
            key={
              binding.id ??
              `${binding.channel_id}-${binding.upstream_model}-${index}`
            }
            className='space-y-3 rounded-md border p-3'
          >
            <div className='grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_6rem_6rem_auto_auto]'>
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
                      <SelectItem key={channel.value} value={channel.value}>
                        {channel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1'>
                <Label className='text-muted-foreground text-xs font-normal'>
                  {t('Upstream model')}
                </Label>
                <Combobox
                  options={upstreamOptions
                    .filter(
                      (option) =>
                        !selectedPairs.has(
                          bindingKey(binding.channel_id, option)
                        )
                    )
                    .map((option) => ({
                      value: option,
                      label: option,
                    }))}
                  value={binding.upstream_model}
                  onValueChange={(value) =>
                    updateBinding(index, {
                      upstream_model: value ?? '',
                    })
                  }
                  placeholder={getUpstreamPlaceholder(
                    binding.channel_id,
                    Boolean(loadingChannelIds[binding.channel_id])
                  )}
                  searchPlaceholder={t('Search upstream model...')}
                  emptyText={t('No upstream models found.')}
                  allowCustomValue={false}
                  openOnFocus
                />
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
              upstream_model: '',
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
