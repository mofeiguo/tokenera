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
import type { ColumnDef } from '@tanstack/react-table'
import {
  ListOrdered,
  Shuffle,
} from 'lucide-react'
import { useState, useMemo, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { BadgeListCell } from '@/components/data-table'
import { ProviderBadge } from '@/components/provider-badge'
import { StatusBadge, type StatusBadgeProps } from '@/components/status-badge'
import { TableId } from '@/components/table-id'
import { TruncatedText } from '@/components/truncated-text'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toIntlLocale } from '@/i18n/languages'
import {
  formatCurrencyFromUSD,
  formatQuotaWithCurrency,
  getCurrencyLabel,
} from '@/lib/currency'
import { formatTimestampToDate } from '@/lib/format'
/* eslint-disable react-refresh/only-export-components */
import { useQueryClient } from '@/lib/query'
import { truncateText } from '@/lib/utils'

import { getCodexUsage, updateChannelBalance } from '../api'
import { CHANNEL_STATUS_CONFIG } from '../constants'
import {
  formatRelativeTime,
  formatResponseTime,
  getBalanceVariant,
  getChannelTypeIcon,
  getChannelTypeLabel,
  getResponseTimeConfig,
  isMultiKeyChannel,
  parseModelsList,
  channelsQueryKeys,
} from '../lib'
import type { Channel } from '../types'
import { ChannelRowActionsLayoutContext } from './channel-row-actions-context'
import { useChannels } from './channels-provider'
import { DataTableRowActions } from './data-table-row-actions'
import { BalanceQueryDialog } from './dialogs/balance-query-dialog'
import {
  CodexUsageDialog,
  type CodexUsageDialogData,
} from './dialogs/codex-usage-dialog'

/**
 * Inline balance/used values longer than this switch to locale-aware compact
 * notation (e.g. "$28万"); the precise value stays available in the tooltip.
 */
const MAX_INLINE_BALANCE_CHARS = 8
const SENSITIVE_MASK = '••••'

/**
 * Balance cell component with click to update
 */
export function BalanceCell({ channel }: { channel: Channel }) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const layout = useContext(ChannelRowActionsLayoutContext)
  const { sensitiveVisible, setCurrentRow } = useChannels()
  const balance = channel.balance || 0
  const usedQuota = channel.used_quota || 0
  const [isUpdating, setIsUpdating] = useState(false)
  const [rawBalanceResponse, setRawBalanceResponse] = useState<string | null>(
    null
  )
  const [codexUsageOpen, setCodexUsageOpen] = useState(false)
  const [codexUsageResponse, setCodexUsageResponse] =
    useState<CodexUsageDialogData | null>(null)
  const currencyLabel = getCurrencyLabel()
  const tokenSuffix = currencyLabel === 'Tokens' ? ' Tokens' : ''
  const withSuffix = (value: string) =>
    tokenSuffix && value !== '-' ? `${value}${tokenSuffix}` : value

  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const balanceFormatOptions = {
    digitsLarge: 2,
    digitsSmall: 4,
    abbreviate: false,
    showSymbol: layout !== 'card',
  } as const
  // Precise values are kept for the tooltip; long values are shown compactly inline.
  const usedFull = withSuffix(
    formatQuotaWithCurrency(usedQuota, {
      digitsLarge: 2,
      digitsSmall: 4,
      abbreviate: true,
      showSymbol: layout !== 'card',
    })
  )
  const remainingFull = withSuffix(
    formatCurrencyFromUSD(balance, balanceFormatOptions)
  )
  const usedDisplay =
    usedFull.length > MAX_INLINE_BALANCE_CHARS
      ? withSuffix(
          formatQuotaWithCurrency(usedQuota, {
            compact: true,
            locale,
            showSymbol: layout !== 'card',
          })
        )
      : usedFull
  const remainingDisplay =
    remainingFull.length > MAX_INLINE_BALANCE_CHARS
      ? withSuffix(
          formatCurrencyFromUSD(balance, {
            compact: true,
            locale,
            showSymbol: layout !== 'card',
          })
        )
      : remainingFull
  const usedLabel = `${t('Used:')} ${usedFull}`
  const remainingLabel = `${t('Remaining:')} ${remainingFull}`
  const maskedUsedLabel = `${t('Used:')} ${SENSITIVE_MASK}`
  const maskedRemainingLabel = `${t('Remaining:')} ${SENSITIVE_MASK}`

  // Regular channel row: show used and remaining with click to update
  const variant = getBalanceVariant(balance)

  const handleClickUpdate = async () => {
    if (isUpdating) {
      return
    }

    setIsUpdating(true)
    if (channel.type === 57) {
      try {
        const res = await getCodexUsage(channel.id)
        if (!res.success) {
          throw new Error(res.message || t('Failed to fetch usage'))
        }
        setCodexUsageResponse(res)
        setCodexUsageOpen(true)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t('Failed to fetch usage')
        )
      } finally {
        setIsUpdating(false)
      }
      return
    }

    try {
      const response = await updateChannelBalance(channel.id)
      if (response.success && response.balance !== undefined) {
        toast.success(
          t('Balance updated: {{balance}}', {
            balance: formatCurrencyFromUSD(response.balance, {
              digitsLarge: 2,
              digitsSmall: 4,
              abbreviate: false,
            }),
          })
        )
        void queryClient.invalidateQueries({
          queryKey: channelsQueryKeys.lists(),
        })
      } else if (response.success && response.raw_response !== undefined) {
        setCurrentRow(channel)
        setRawBalanceResponse(response.raw_response)
      } else {
        toast.error(response.message || t('Failed to update balance'))
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : t('Failed to update balance')
      )
    } finally {
      setIsUpdating(false)
    }
  }
  let remainingBadgeLabel = sensitiveVisible ? remainingDisplay : SENSITIVE_MASK
  if (sensitiveVisible && isUpdating) {
    remainingBadgeLabel = t('Updating...')
  } else if (sensitiveVisible && channel.type === 57) {
    remainingBadgeLabel = t('Account Info')
  }
  let remainingTooltipLabel = remainingLabel
  if (!sensitiveVisible) {
    remainingTooltipLabel = maskedRemainingLabel
  } else if (channel.type === 57) {
    remainingTooltipLabel = t('Click to view Codex usage')
  }
  let remainingBadgeVariant: StatusBadgeProps['variant'] = variant
  if (channel.type === 57) {
    remainingBadgeVariant = 'info'
  } else if (isUpdating) {
    remainingBadgeVariant = 'neutral'
  }

  return (
    <TooltipProvider>
      <div className='-ml-1.5 flex items-center gap-1'>
        <Tooltip>
          <TooltipTrigger
            render={
              <StatusBadge
                label={sensitiveVisible ? usedDisplay : SENSITIVE_MASK}
                variant='neutral'
                size='sm'
                copyable={false}
                showDot={false}
                className='cursor-help'
              />
            }
          />
          <TooltipContent>
            <p>{sensitiveVisible ? usedLabel : maskedUsedLabel}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <StatusBadge
                label={remainingBadgeLabel}
                variant={remainingBadgeVariant}
                size='sm'
                copyable={false}
                showDot={false}
                className='cursor-pointer'
                onClick={handleClickUpdate}
              />
            }
          />
          <TooltipContent>
            <p>{remainingTooltipLabel}</p>
            {channel.type !== 57 && <p>{t('Click to update balance')}</p>}
          </TooltipContent>
        </Tooltip>
      </div>

      <CodexUsageDialog
        open={codexUsageOpen}
        onOpenChange={setCodexUsageOpen}
        channelName={channel.name}
        channelId={channel.id}
        channelDisplayName={sensitiveVisible ? undefined : SENSITIVE_MASK}
        channelDisplayId={sensitiveVisible ? undefined : SENSITIVE_MASK}
        response={codexUsageResponse}
        onRefresh={async () => {
          if (isUpdating) {
            return
          }
          setIsUpdating(true)
          try {
            const res = await getCodexUsage(channel.id)
            if (!res.success) {
              throw new Error(res.message || t('Failed to fetch usage'))
            }
            setCodexUsageResponse(res)
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : t('Failed to fetch usage')
            )
          } finally {
            setIsUpdating(false)
          }
        }}
        isRefreshing={isUpdating}
      />
      {rawBalanceResponse !== null && (
        <BalanceQueryDialog
          initialRawResponse={rawBalanceResponse}
          open
          onOpenChange={(open) => {
            if (!open) {
              setRawBalanceResponse(null)
            }
          }}
        />
      )}
    </TooltipProvider>
  )
}

/**
 * Generate channels columns configuration
 */
export function useChannelsColumns(
  options: {
    enableSelection?: boolean
  } = {}
): ColumnDef<Channel>[] {
  const { t, i18n } = useTranslation()
  const { sensitiveVisible } = useChannels()
  const enableSelection = options.enableSelection ?? true
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  // The column definitions only depend on the translation function, the active
  // locale, and sensitive-data visibility. Memoizing keeps the array (and every
  // cell renderer reference) stable across unrelated re-renders, so react-table
  // does not invalidate the whole row model on each parent render.
  return useMemo<ColumnDef<Channel>[]>(
    () => [
      // Checkbox column
      ...(enableSelection
        ? [
            {
              id: 'select',
              header: ({ table }) => (
                <Checkbox
                  checked={table.getIsAllPageRowsSelected()}
                  indeterminate={table.getIsSomePageRowsSelected()}
                  onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                  }
                  aria-label={t('Select all')}
                />
              ),
              cell: ({ row }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(!!value)}
                  aria-label={t('Select row')}
                />
              ),
              enableSorting: false,
              enableHiding: false,
              enableResizing: false,
              size: 40,
            } satisfies ColumnDef<Channel>,
          ]
        : []),

      // ID column
      {
        accessorKey: 'id',
        header: t('ID'),
        meta: { mobileHidden: true },
        cell: ({ row }) => {
          const id = row.getValue('id') as number
          return <TableId value={sensitiveVisible ? id : SENSITIVE_MASK} />
        },
        size: 80,
      },
      // Name column
      {
        accessorKey: 'name',
        header: t('Name'),
        meta: { mobileTitle: true },
        cell: ({ row }) => {
          const name = row.getValue('name') as string
          const channel = row.original

          return (
            <div className='flex max-w-full min-w-0 items-center gap-2'>
              <div className='flex max-w-full min-w-0 flex-col gap-1'>
                <div className='flex max-w-full min-w-0 items-center gap-1.5'>
                  <TruncatedText
                    text={sensitiveVisible ? name : SENSITIVE_MASK}
                    className='font-medium'
                    maxWidth='max-w-full'
                  />
                </div>
                {channel.remark && (
                  <TooltipProvider delay={200}>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span className='text-muted-foreground text-xs' />
                        }
                      >
                        {truncateText(channel.remark, 40)}
                      </TooltipTrigger>
                      <TooltipContent side='bottom' className='max-w-xs'>
                        {channel.remark}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          )
        },
        size: 260,
        minSize: 200,
      },

      // Type column
      {
        accessorKey: 'type',
        header: t('Type'),
        cell: ({ row }) => {
          const type = row.getValue('type') as number
          const typeNameKey = getChannelTypeLabel(type)
          const typeName = t(typeNameKey)
          const iconName = getChannelTypeIcon(type)
          const channel = row.original as Channel
          const isMultiKey = isMultiKeyChannel(channel)
          const multiKeyMode = channel.channel_info?.multi_key_mode ?? 'random'
          const MultiKeyModeIcon =
            multiKeyMode === 'random' ? Shuffle : ListOrdered
          const multiKeyTooltip =
            multiKeyMode === 'random'
              ? t('Multi-key: Random rotation')
              : t('Multi-key: Polling rotation')

          return (
            <div className='flex max-w-full min-w-0 items-center gap-2 overflow-hidden'>
              {isMultiKey && (
                <TooltipProvider delay={100}>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <span className='border-border bg-muted text-primary inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border' />
                      }
                    >
                      <MultiKeyModeIcon className='h-3 w-3' />
                    </TooltipTrigger>
                    <TooltipContent side='top'>
                      {multiKeyTooltip}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <TooltipProvider delay={300}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <div className='max-w-full min-w-0 overflow-hidden' />
                    }
                  >
                    <ProviderBadge
                      iconKey={`${iconName}.Color`}
                      iconSize={18}
                      label={typeName}
                      colorText={false}
                      copyable={false}
                      showDot={false}
                      className='max-w-full min-w-0 overflow-hidden'
                    />
                  </TooltipTrigger>
                  <TooltipContent side='top'>{typeName}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )
        },
        filterFn: (row, id, value) => {
          if (!value || value.length === 0 || value.includes('all')) {
            return true
          }
          return value.includes(String(row.getValue(id)))
        },
        size: 220,
        enableSorting: false,
      },

      // Status column
      {
        accessorKey: 'status',
        header: t('Status'),
        meta: { mobileBadge: true },
        cell: ({ row }) => {
          const status = row.getValue('status') as number
          const channel = row.original as Channel

          // Regular channel row
          const config =
            CHANNEL_STATUS_CONFIG[
              status as keyof typeof CHANNEL_STATUS_CONFIG
            ] || CHANNEL_STATUS_CONFIG[0]

          const isMultiKey = isMultiKeyChannel(channel)
          const keySize = channel.channel_info?.multi_key_size ?? 0
          const disabledCount = channel.channel_info?.multi_key_status_list
            ? Object.keys(channel.channel_info.multi_key_status_list).length
            : 0
          const enabledCount = Math.max(0, keySize - disabledCount)
          const label =
            isMultiKey && keySize > 0
              ? `${t(config.label)} (${enabledCount}/${keySize})`
              : t(config.label)

          // Auto-disabled: show reason and time tooltip
          if (status === 3) {
            let statusReason = ''
            let statusTime = ''
            try {
              const otherInfo = channel.other_info
                ? JSON.parse(channel.other_info)
                : null
              if (otherInfo) {
                statusReason = otherInfo.status_reason || ''
                statusTime = otherInfo.status_time
                  ? formatTimestampToDate(otherInfo.status_time)
                  : ''
              }
            } catch {
              /* empty */
            }

            if (statusReason || statusTime) {
              return (
                <TooltipProvider delay={100}>
                  <Tooltip>
                    <TooltipTrigger render={<span />}>
                      <StatusBadge
                        label={label}
                        variant={config.variant}
                        size='sm'
                        copyable={false}
                      />
                    </TooltipTrigger>
                    <TooltipContent side='top' className='max-w-xs'>
                      <div className='space-y-1 text-xs'>
                        {statusReason && (
                          <div>
                            {t('Reason:')} {statusReason}
                          </div>
                        )}
                        {statusTime && (
                          <div>
                            {t('Time:')} {statusTime}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            }
          }

          return (
            <StatusBadge
              label={label}
              variant={config.variant}
              size='sm'
              copyable={false}
            />
          )
        },
        filterFn: (row, id, value) => {
          if (!value || value.length === 0 || value.includes('all')) {
            return true
          }
          const status = row.getValue(id) as number
          if (value.includes('enabled')) {
            return status === 1
          }
          if (value.includes('disabled')) {
            return status !== 1
          }
          return false
        },
        size: 120,
        enableSorting: false,
      },

      // Models column
      {
        accessorKey: 'models',
        header: t('Models'),
        meta: { mobileHidden: true },
        cell: ({ row }) => {
          const models = row.getValue('models') as string
          const modelArray = parseModelsList(models)
          return (
            <BadgeListCell
              items={modelArray.map((model) => (
                <StatusBadge
                  key={model}
                  label={model}
                  autoColor={model}
                  size='sm'
                  className='font-mono'
                />
              ))}
            />
          )
        },
        size: 200,
        enableSorting: false,
      },

      // Balance column (Used/Remaining)
      {
        accessorKey: 'balance',
        header: t('Used / Remaining'),
        cell: ({ row }) => <BalanceCell channel={row.original} />,
        size: 180,
      },

      // Response Time column
      {
        accessorKey: 'response_time',
        header: t('Response'),
        meta: { mobileHidden: true },
        cell: ({ row }) => {
          const responseTime = row.getValue('response_time') as number
          const config = getResponseTimeConfig(responseTime)

          return (
            <StatusBadge
              label={formatResponseTime(responseTime, t)}
              variant={config.variant}
              size='sm'
              copyable={false}
              className='-ml-1.5'
            />
          )
        },
        size: 110,
      },

      // Test Time column
      {
        accessorKey: 'test_time',
        header: t('Last Tested'),
        meta: { mobileHidden: true },
        cell: ({ row }) => {
          const testTime = row.getValue('test_time') as number

          // For invalid timestamps, show "Never" badge
          if (!testTime || testTime === 0) {
            return <span className='text-muted-foreground text-xs'>-</span>
          }

          const timeText = formatRelativeTime(testTime, locale)
          const fullDate = formatTimestampToDate(testTime)

          // For valid timestamps, show tooltip with full date
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <StatusBadge
                      label={timeText}
                      variant='neutral'
                      size='sm'
                      copyable={false}
                      className='-ml-1.5 cursor-pointer'
                    />
                  }
                />
                <TooltipContent side='top'>
                  <p className='font-mono text-sm'>{fullDate}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        },
        size: 120,
        enableSorting: false,
      },

      // Actions column
      {
        id: 'actions',
        header: () => t('Actions'),
        cell: ({ row }) => <DataTableRowActions row={row} />,
        enableSorting: false,
        enableHiding: false,
        meta: { pinned: 'right' as const },
      },
    ],
    [enableSelection, t, locale, sensitiveVisible]
  )
}
