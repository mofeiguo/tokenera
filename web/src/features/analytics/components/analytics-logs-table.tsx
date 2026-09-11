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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DetailsDialog } from '@/features/usage-logs/components/dialogs/details-dialog'
import { getUserLogs } from '@/features/usage-logs/api'
import { LOG_TYPE_ENUM } from '@/features/usage-logs/constants'
import type { UsageLog } from '@/features/usage-logs/data/schema'
import { parseLogOther } from '@/features/usage-logs/lib/format'
import {
  formatLogQuota,
  formatNumber,
  formatTimestampToDate,
} from '@/lib/format'
import { useQuery } from '@/lib/query'
import { dateToUnixTimestamp } from '@/lib/time'
import { cn } from '@/lib/utils'

import {
  cacheReadPercent,
  latencyMs,
  tokensPerSecond,
} from '../lib/log-metrics'
import type { AnalyticsFilters } from '../types'
import { AnalyticsNameCell } from './analytics-name-cell'
import {
  analyticsTableCellClass,
  analyticsTableHeadClass,
} from './analytics-styles'

const PAGE_SIZE = 20

type AnalyticsLogsTableProps = {
  filters: AnalyticsFilters
}

function isUsageLog(value: unknown): value is UsageLog {
  return Boolean(value && typeof value === 'object' && 'model_name' in value)
}

export function AnalyticsLogsTable(props: AnalyticsLogsTableProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<UsageLog | null>(null)
  const start = props.filters.start_timestamp
    ? dateToUnixTimestamp(props.filters.start_timestamp)
    : undefined
  const end = props.filters.end_timestamp
    ? dateToUnixTimestamp(props.filters.end_timestamp)
    : undefined

  const query = useQuery({
    queryKey: [
      'analytics',
      'logs',
      page,
      start,
      end,
      props.filters.modelName,
    ],
    queryFn: async () => {
      // Current-user consume logs only. Channel fields stay on admin log pages.
      const params = {
        p: page,
        page_size: PAGE_SIZE,
        type: LOG_TYPE_ENUM.CONSUME,
        start_timestamp: start,
        end_timestamp: end,
        ...(props.filters.modelName
          ? { model_name: props.filters.modelName }
          : {}),
      }
      const res = await getUserLogs(params)
      const items = res.data?.items ?? []
      return {
        items: items.filter(isUsageLog),
        total: res.data?.total ?? 0,
      }
    },
  })

  const rows = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  let tableRows = rows.map((row) => {
    const other = parseLogOther(row.other)
    const cachePercent = cacheReadPercent(
      row.prompt_tokens,
      other?.cache_tokens ?? 0
    )
    const latency = latencyMs(row.use_time)
    const throughput = tokensPerSecond(row.completion_tokens, row.use_time)
    return (
      <TableRow className='hover:bg-[#fafafa] dark:hover:bg-muted/30' key={row.id}>
        <TableCell className={cn(analyticsTableCellClass, 'whitespace-nowrap')}>
          {formatTimestampToDate(row.created_at)}
        </TableCell>
        <TableCell className={cn(analyticsTableCellClass, 'max-w-[12rem] truncate')}>
          {row.token_name || '—'}
        </TableCell>
        <TableCell className={cn(analyticsTableCellClass, 'max-w-[16rem]')}>
          <AnalyticsNameCell name={row.model_name} />
        </TableCell>
        <TableCell className={cn(analyticsTableCellClass, 'text-right tabular-nums')}>
          {formatNumber(row.prompt_tokens)}
        </TableCell>
        <TableCell className={cn(analyticsTableCellClass, 'text-right tabular-nums')}>
          {formatNumber(row.completion_tokens)}
        </TableCell>
        <TableCell className={cn(analyticsTableCellClass, 'text-right tabular-nums')}>
          {cachePercent == null ? '—' : `${cachePercent.toFixed(2)}%`}
        </TableCell>
        <TableCell className={cn(analyticsTableCellClass, 'text-right tabular-nums')}>
          {formatLogQuota(row.quota)}
        </TableCell>
        <TableCell className={analyticsTableCellClass}>
          {row.is_stream ? t('Yes') : t('No')}
        </TableCell>
        <TableCell className={cn(analyticsTableCellClass, 'text-right tabular-nums')}>
          {latency == null ? '—' : `${formatNumber(latency)}ms`}
        </TableCell>
        <TableCell className={cn(analyticsTableCellClass, 'text-right tabular-nums')}>
          {throughput == null ? '—' : `${throughput.toFixed(2)}tps`}
        </TableCell>
        <TableCell className={cn(analyticsTableCellClass, 'max-w-[8rem] truncate')}>
          {other?.stream_status?.end_reason || '—'}
        </TableCell>
        <TableCell className={cn(analyticsTableCellClass, 'text-right')}>
          <button
            className='text-[#666666] hover:text-foreground cursor-pointer text-[13px]'
            onClick={() => setSelected(row)}
            type='button'
          >
            {t('Details')}
          </button>
        </TableCell>
      </TableRow>
    )
  })
  if (query.isLoading) {
    tableRows = [
      <TableRow key='loading'>
        <TableCell colSpan={12}>
          <Skeleton className='h-10 w-full' />
        </TableCell>
      </TableRow>,
    ]
  } else if (rows.length === 0) {
    tableRows = [
      <TableRow key='empty'>
        <TableCell
          className='text-muted-foreground h-40 text-center text-sm'
          colSpan={12}
        >
          {t('No data')}
        </TableCell>
      </TableRow>,
    ]
  }

  return (
    <div>
      <div className='overflow-x-auto'>
        <Table className='min-w-[80rem]'>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead className={analyticsTableHeadClass}>{t('Time')}</TableHead>
              <TableHead className={analyticsTableHeadClass}>
                {t('API Key')}
              </TableHead>
              <TableHead className={analyticsTableHeadClass}>{t('Model')}</TableHead>
              <TableHead className={cn(analyticsTableHeadClass, 'text-right')}>
                {t('Input tokens')}
              </TableHead>
              <TableHead className={cn(analyticsTableHeadClass, 'text-right')}>
                {t('Output tokens')}
              </TableHead>
              <TableHead className={cn(analyticsTableHeadClass, 'text-right')}>
                {t('Cache Read')}
              </TableHead>
              <TableHead className={cn(analyticsTableHeadClass, 'text-right')}>
                {t('Cost')}
              </TableHead>
              <TableHead className={analyticsTableHeadClass}>{t('Stream')}</TableHead>
              <TableHead className={cn(analyticsTableHeadClass, 'text-right')}>
                {t('Latency')}
              </TableHead>
              <TableHead className={cn(analyticsTableHeadClass, 'text-right')}>
                {t('Throughput')}
              </TableHead>
              <TableHead className={analyticsTableHeadClass}>
                {t('Finish Reason')}
              </TableHead>
              <TableHead className={cn(analyticsTableHeadClass, 'text-right')}>
                {t('Details')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{tableRows}</TableBody>
        </Table>
      </div>
      {total > PAGE_SIZE ? (
        <div className='flex items-center justify-end gap-3 px-1 py-4'>
          <Button
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            size='sm'
            type='button'
            variant='outline'
          >
            {t('Previous')}
          </Button>
          <span className='text-muted-foreground text-sm tabular-nums'>
            {page} / {pageCount}
          </span>
          <Button
            disabled={page >= pageCount}
            onClick={() => setPage((current) => current + 1)}
            size='sm'
            type='button'
            variant='outline'
          >
            {t('Next')}
          </Button>
        </div>
      ) : null}
      {selected ? (
        <DetailsDialog
          isAdmin={false}
          log={selected}
          onOpenChange={(open) => {
            if (!open) setSelected(null)
          }}
          open
        />
      ) : null}
    </div>
  )
}
