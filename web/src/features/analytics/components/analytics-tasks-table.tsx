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
import { getUserTaskLogs } from '@/features/usage-logs/api'
import { FailReasonDialog } from '@/features/usage-logs/components/dialogs/fail-reason-dialog'
import { TASK_ACTIONS, TASK_STATUS } from '@/features/usage-logs/constants'
import { formatDuration } from '@/features/usage-logs/lib/format'
import {
  taskActionMapper,
  taskStatusMapper,
} from '@/features/usage-logs/lib/mappers'
import type { TaskLog } from '@/features/usage-logs/types'
import { formatTimestampToDate } from '@/lib/format'
import { useQuery } from '@/lib/query'
import { dateToUnixTimestamp } from '@/lib/time'
import { cn } from '@/lib/utils'

import {
  analyticsTableCellClass,
  analyticsTableHeadClass,
} from './analytics-styles'

const PAGE_SIZE = 20

export type AnalyticsTaskFilters = {
  end_timestamp?: Date
  start_timestamp?: Date
  taskId?: string
}

type AnalyticsTasksTableProps = {
  filters: AnalyticsTaskFilters
}

function isTaskLog(value: unknown): value is TaskLog {
  return Boolean(value && typeof value === 'object' && 'task_id' in value)
}

function isVideoTask(action: string): boolean {
  return (
    action === TASK_ACTIONS.GENERATE ||
    action === TASK_ACTIONS.TEXT_GENERATE ||
    action === TASK_ACTIONS.FIRST_TAIL_GENERATE ||
    action === TASK_ACTIONS.REFERENCE_GENERATE ||
    action === TASK_ACTIONS.REMIX_GENERATE
  )
}

function statusTextClass(status: string): string {
  if (status === TASK_STATUS.SUCCESS) {
    return 'text-emerald-600 dark:text-emerald-400'
  }
  if (status === TASK_STATUS.FAILURE) {
    return 'text-red-600 dark:text-red-400'
  }
  if (status === TASK_STATUS.IN_PROGRESS) {
    return 'text-blue-600 dark:text-blue-400'
  }
  if (status === TASK_STATUS.QUEUED || status === TASK_STATUS.SUBMITTED) {
    return 'text-amber-600 dark:text-amber-400'
  }
  return 'text-[#666666] dark:text-muted-foreground'
}

function TaskDetailsCell(props: { log: TaskLog }) {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const failReason = props.log.fail_reason
  const canPreview =
    props.log.status === TASK_STATUS.SUCCESS &&
    isVideoTask(props.log.action) &&
    Boolean(failReason?.startsWith('http'))

  if (canPreview) {
    return (
      <a
        className='text-[#666666] hover:text-foreground text-[13px] hover:underline'
        href={`/v1/videos/${props.log.task_id}/content`}
        rel='noopener noreferrer'
        target='_blank'
      >
        {t('Click to preview video')}
      </a>
    )
  }

  if (!failReason) {
    return '—'
  }

  return (
    <>
      <button
        className='text-red-600 hover:text-foreground max-w-[16rem] cursor-pointer truncate text-left text-[13px] hover:underline dark:text-red-400'
        onClick={() => setDialogOpen(true)}
        title={t('Click to view full error message')}
        type='button'
      >
        {failReason}
      </button>
      <FailReasonDialog
        failReason={failReason}
        onOpenChange={setDialogOpen}
        open={dialogOpen}
      />
    </>
  )
}

export function AnalyticsTasksTable(props: AnalyticsTasksTableProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const start = props.filters.start_timestamp
    ? dateToUnixTimestamp(props.filters.start_timestamp)
    : undefined
  const end = props.filters.end_timestamp
    ? dateToUnixTimestamp(props.filters.end_timestamp)
    : undefined
  const taskId = props.filters.taskId?.trim()

  const query = useQuery({
    queryKey: ['analytics', 'tasks', page, start, end, taskId],
    queryFn: async () => {
      const res = await getUserTaskLogs({
        p: page,
        page_size: PAGE_SIZE,
        start_timestamp: start,
        end_timestamp: end,
        ...(taskId ? { task_id: taskId } : {}),
      })
      const items = res.data?.items ?? []
      return {
        items: items.filter(isTaskLog),
        total: res.data?.total ?? 0,
      }
    },
  })

  const rows = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  let tableRows = rows.map((row) => {
    const duration = formatDuration(row.submit_time, row.finish_time, 'seconds')
    return (
      <TableRow className='hover:bg-[#fafafa] dark:hover:bg-muted/30' key={row.id}>
        <TableCell className={cn(analyticsTableCellClass, 'whitespace-nowrap')}>
          {formatTimestampToDate(row.submit_time, 'seconds')}
        </TableCell>
        <TableCell className={cn(analyticsTableCellClass, 'max-w-[18rem]')}>
          <div className='min-w-0'>
            <div className='truncate font-mono text-[13px] text-[#333333] dark:text-foreground'>
              {row.task_id || '—'}
            </div>
            <div className='text-[#999999] truncate text-[12px]'>
              {t(row.platform)} · {t(taskActionMapper.getLabel(row.action))}
            </div>
          </div>
        </TableCell>
        <TableCell className={cn(analyticsTableCellClass, 'text-right tabular-nums')}>
          {duration ? `${duration.durationSec.toFixed(1)}s` : '—'}
        </TableCell>
        <TableCell className={cn(analyticsTableCellClass, statusTextClass(row.status))}>
          {t(taskStatusMapper.getLabel(row.status, row.status || 'Unknown'))}
        </TableCell>
        <TableCell className={analyticsTableCellClass}>
          {row.progress || '—'}
        </TableCell>
        <TableCell className={analyticsTableCellClass}>
          <TaskDetailsCell log={row} />
        </TableCell>
      </TableRow>
    )
  })
  if (query.isLoading) {
    tableRows = [
      <TableRow key='loading'>
        <TableCell colSpan={6}>
          <Skeleton className='h-10 w-full' />
        </TableCell>
      </TableRow>,
    ]
  } else if (rows.length === 0) {
    tableRows = [
      <TableRow key='empty'>
        <TableCell
          className='text-muted-foreground h-40 text-center text-sm'
          colSpan={6}
        >
          {t('No data')}
        </TableCell>
      </TableRow>,
    ]
  }

  return (
    <div>
      <div className='overflow-x-auto'>
        <Table className='min-w-[56rem]'>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead className={analyticsTableHeadClass}>{t('Time')}</TableHead>
              <TableHead className={analyticsTableHeadClass}>
                {t('Task ID')}
              </TableHead>
              <TableHead className={cn(analyticsTableHeadClass, 'text-right')}>
                {t('Duration')}
              </TableHead>
              <TableHead className={analyticsTableHeadClass}>{t('Status')}</TableHead>
              <TableHead className={analyticsTableHeadClass}>
                {t('Progress')}
              </TableHead>
              <TableHead className={analyticsTableHeadClass}>
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
    </div>
  )
}
