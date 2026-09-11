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
import { Check, Copy, Loader2 } from 'lucide-react'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { BadgeCell } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { copyToClipboard } from '@/lib/copy-to-clipboard'
import { formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'

import type { ApiKey } from '../types'
import { useApiKeys } from './api-keys-provider'

function getQuotaProgressColor(percentage: number): string {
  if (percentage <= 10) return '[&_[data-slot=progress-indicator]]:bg-destructive'
  if (percentage <= 30) return '[&_[data-slot=progress-indicator]]:bg-warning'
  return '[&_[data-slot=progress-indicator]]:bg-success'
}

export function ApiKeyCell(props: { apiKey: ApiKey }) {
  const apiKey = props.apiKey
  const { t } = useTranslation()
  const {
    resolveRealKey,
    resolvedKeys,
    loadingKeys,
    copiedKeyId,
    markKeyCopied,
  } = useApiKeys()
  const [popoverOpen, setPopoverOpen] = useState(false)

  const isLoading = !!loadingKeys[apiKey.id]
  const resolvedFullKey = resolvedKeys[apiKey.id]
  const isCopied = copiedKeyId === apiKey.id
  const maskedKey = `sk-${apiKey.key}`

  const handlePopoverOpen = useCallback(
    (open: boolean) => {
      setPopoverOpen(open)
      if (open && !resolvedFullKey) {
        resolveRealKey(apiKey.id)
      }
    },
    [resolvedFullKey, resolveRealKey, apiKey.id]
  )

  const handleCopy = useCallback(async () => {
    const realKey = resolvedFullKey || (await resolveRealKey(apiKey.id))
    if (!realKey) return

    const ok = await copyToClipboard(realKey)
    if (ok) markKeyCopied(apiKey.id)
  }, [resolvedFullKey, resolveRealKey, apiKey.id, markKeyCopied])

  let copyIcon = <Copy className='size-3.5' />
  let copyTooltip = t('Copy API key')
  if (isLoading) {
    copyIcon = <Loader2 className='size-3.5 animate-spin' />
    copyTooltip = t('Loading...')
  } else if (isCopied) {
    copyIcon = <Check className='text-success size-3.5' />
    copyTooltip = t('Copied!')
  }

  return (
    <div className='flex max-w-full min-w-0 items-center gap-0.5'>
      <Popover open={popoverOpen} onOpenChange={handlePopoverOpen}>
        <PopoverTrigger
          render={
            <Button
              variant='ghost'
              size='sm'
              aria-label={t('Reveal full API key')}
              className='h-auto max-w-full min-w-0 justify-start truncate px-0 py-0 font-mono text-[13px] font-normal tracking-[-0.01em] text-[#171717] hover:bg-transparent aria-expanded:bg-transparent dark:text-foreground'
            />
          }
        >
          <span className='truncate'>{maskedKey}</span>
        </PopoverTrigger>
        <PopoverContent
          className='w-auto max-w-[min(90vw,28rem)]'
          align='start'
        >
          <div className='flex flex-col gap-2'>
            <p className='text-muted-foreground text-xs'>{t('Full API Key')}</p>
            {isLoading ? (
              <div className='flex items-center gap-2 py-2'>
                <Loader2 className='size-3.5 animate-spin' />
                <span className='text-muted-foreground text-xs'>
                  {t('Loading...')}
                </span>
              </div>
            ) : (
              <input
                readOnly
                value={resolvedFullKey || maskedKey}
                autoFocus
                onFocus={(e) => e.target.select()}
                className='bg-muted/50 w-full min-w-[280px] rounded-md border px-3 py-2 font-mono text-xs outline-none'
              />
            )}
          </div>
        </PopoverContent>
      </Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon'
              className='size-7 shrink-0 text-[#888888] hover:bg-transparent hover:text-[#171717] dark:text-muted-foreground dark:hover:text-foreground'
              onClick={handleCopy}
              disabled={isLoading}
              aria-label={copyTooltip}
            />
          }
        >
          {copyIcon}
        </TooltipTrigger>
        <TooltipContent>{copyTooltip}</TooltipContent>
      </Tooltip>
    </div>
  )
}

type QuotaCellProps = {
  apiKey: ApiKey
  className?: string
  compact?: boolean
}

export function QuotaCell(props: QuotaCellProps) {
  const { t } = useTranslation()
  const apiKey = props.apiKey

  if (props.compact) {
    if (apiKey.unlimited_quota) {
      return (
        <span className={cn('text-[13px] text-[#666666]', props.className)}>
          {t('Unlimited')}
        </span>
      )
    }
    return (
      <span className={cn('text-[13px] text-[#666666] tabular-nums', props.className)}>
        {formatQuota(apiKey.remain_quota)}
      </span>
    )
  }

  if (apiKey.unlimited_quota) {
    return <UnlimitedQuotaBadge used={apiKey.used_quota} />
  }

  const used = apiKey.used_quota
  const remaining = apiKey.remain_quota
  const total = used + remaining
  const percentage = total > 0 ? (remaining / total) * 100 : 0

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            data-slot='quota-cell'
            className={cn('flex w-[150px] flex-col gap-1', props.className)}
          />
        }
      >
        <div className='flex justify-between text-xs'>
          <span className='font-medium tabular-nums'>
            {formatQuota(remaining)}
          </span>
          <span className='text-muted-foreground tabular-nums'>
            {formatQuota(total)}
          </span>
        </div>
        <Progress
          value={percentage}
          className={cn('h-1.5', getQuotaProgressColor(percentage))}
        />
      </TooltipTrigger>
      <TooltipContent>
        <div className='flex flex-col gap-1 text-xs'>
          <div>
            {t('Used:')} {formatQuota(used)}
          </div>
          <div>
            {t('Remaining:')} {formatQuota(remaining)} (
            {percentage.toFixed(1)}%)
          </div>
          <div>
            {t('Total:')} {formatQuota(total)}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

type UnlimitedQuotaBadgeProps = {
  used: number
}

export function UnlimitedQuotaBadge(props: UnlimitedQuotaBadgeProps) {
  const { t } = useTranslation()
  const formattedUsed = formatQuota(props.used)

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type='button'
            className='focus-visible:ring-ring/50 -ml-1.5 cursor-help rounded-4xl focus-visible:ring-[3px] focus-visible:outline-none'
            aria-label={`${t('Unlimited')}; ${t('Used:')} ${formattedUsed}`}
          />
        }
      >
        <StatusBadge
          label={t('Unlimited')}
          variant='neutral'
          copyable={false}
        />
      </PopoverTrigger>
      <PopoverContent className='w-auto p-2' side='top'>
        <span className='text-xs'>
          {t('Used:')} {formattedUsed}
        </span>
      </PopoverContent>
    </Popover>
  )
}

export function ModelLimitsCell({ apiKey }: { apiKey: ApiKey }) {
  const { t } = useTranslation()

  if (!apiKey.model_limits_enabled || !apiKey.model_limits) {
    return (
      <StatusBadge
        label={t('Unlimited')}
        variant='neutral'
        copyable={false}
        className='-ml-1.5'
      />
    )
  }

  const models = apiKey.model_limits.split(',').filter(Boolean)

  return (
    <Tooltip>
      <TooltipTrigger render={<BadgeCell />}>
        <StatusBadge
          label={t('{{count}} model(s)', { count: models.length })}
          variant='neutral'
          copyable={false}
        />
      </TooltipTrigger>
      <TooltipContent side='top' className='max-w-xs'>
        <div className='max-h-[200px] space-y-0.5 overflow-y-auto text-xs'>
          {models.map((m) => (
            <div key={m} className='font-mono'>
              {m}
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function IpRestrictionsCell({ apiKey }: { apiKey: ApiKey }) {
  const { t } = useTranslation()
  const allowIps = apiKey.allow_ips?.trim()

  if (!allowIps) {
    return (
      <StatusBadge
        label={t('No restriction')}
        variant='neutral'
        copyable={false}
        className='-ml-1.5'
      />
    )
  }

  const ips = allowIps
    .split('\n')
    .map((ip) => ip.trim())
    .filter(Boolean)

  return (
    <Tooltip>
      <TooltipTrigger render={<BadgeCell />}>
        <StatusBadge
          label={t('{{count}} IP(s)', { count: ips.length })}
          variant='neutral'
          copyable={false}
        />
      </TooltipTrigger>
      <TooltipContent side='top' className='max-w-xs'>
        <div className='max-h-[200px] space-y-0.5 overflow-y-auto text-xs'>
          {ips.map((ip) => (
            <div key={ip} className='font-mono'>
              {ip}
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
