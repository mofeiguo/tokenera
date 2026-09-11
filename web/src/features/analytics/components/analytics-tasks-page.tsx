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
import { enUS, zhCN } from 'react-day-picker/locale'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import {
  buildDefaultDashboardFilters,
  getSavedChartPreferences,
} from '@/features/dashboard/lib'
import { useIsFetching, useQueryClient } from '@/lib/query'
import { getEndOfDay, getStartOfDay } from '@/lib/time'
import { cn } from '@/lib/utils'

import { AnalyticsDateRangeField } from './analytics-filter-bar'
import { AnalyticsPageShell } from './analytics-page-shell'
import { analyticsControlClass } from './analytics-styles'
import {
  AnalyticsTasksTable,
  type AnalyticsTaskFilters,
} from './analytics-tasks-table'

const calendarLocales = {
  en: enUS,
  zhCN,
} as const

export function AnalyticsTasksPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<AnalyticsTaskFilters>(() => {
    const defaults = buildDefaultDashboardFilters(getSavedChartPreferences())
    return {
      start_timestamp: defaults.start_timestamp,
      end_timestamp: defaults.end_timestamp,
      taskId: '',
    }
  })
  const [taskIdInput, setTaskIdInput] = useState('')
  const refreshing = useIsFetching({ queryKey: ['analytics', 'tasks'] }) > 0
  const calendarLocale =
    calendarLocales[i18n.language as keyof typeof calendarLocales] ?? enUS

  return (
    <AnalyticsPageShell
      onRefresh={() => {
        void queryClient.invalidateQueries({ queryKey: ['analytics', 'tasks'] })
      }}
      refreshing={refreshing}
      title={t('Task')}
      toolbar={
        <div className='mt-4 flex flex-wrap items-center gap-3'>
          <AnalyticsDateRangeField
            calendarLocale={calendarLocale}
            onSelect={(range) => {
              if (!range?.from) return
              setFilters({
                ...filters,
                start_timestamp: getStartOfDay(range.from),
                end_timestamp: getEndOfDay(range.to ?? range.from),
              })
            }}
            selected={{
              from: filters.start_timestamp,
              to: filters.end_timestamp,
            }}
          />
          <Input
            aria-label={t('Task ID')}
            className={cn(analyticsControlClass, 'w-[16rem]')}
            onBlur={() => {
              setFilters({
                ...filters,
                taskId: taskIdInput.trim(),
              })
            }}
            onChange={(event) => setTaskIdInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              setFilters({
                ...filters,
                taskId: taskIdInput.trim(),
              })
            }}
            placeholder={t('Filter by task ID')}
            value={taskIdInput}
          />
        </div>
      }
    >
      <AnalyticsTasksTable
        filters={filters}
        key={`${filters.start_timestamp?.getTime()}-${filters.end_timestamp?.getTime()}-${filters.taskId}`}
      />
    </AnalyticsPageShell>
  )
}
