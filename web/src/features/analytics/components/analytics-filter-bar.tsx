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
import { Calendar as CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { enUS, zhCN } from 'react-day-picker/locale'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TIME_GRANULARITY_OPTIONS } from '@/features/dashboard/constants'
import {
  buildDefaultDashboardFilters,
  getSavedChartPreferences,
} from '@/features/dashboard/lib'
import dayjs from '@/lib/dayjs'
import { cn } from '@/lib/utils'
import { getEndOfDay, getStartOfDay, type TimeGranularity } from '@/lib/time'

import type { AnalyticsFilters } from '../types'
import { analyticsControlClass } from './analytics-styles'

const calendarLocales = {
  en: enUS,
  zhCN,
} as const

const ALL_MODELS = '__all_models__'

type AnalyticsFilterBarProps = {
  filters: AnalyticsFilters
  models: string[]
  onFiltersChange: (filters: AnalyticsFilters) => void
  showGranularity?: boolean
}

export function AnalyticsFilterBar(props: AnalyticsFilterBarProps) {
  const { t, i18n } = useTranslation()
  const granularity = props.filters.time_granularity ?? 'hour'
  const calendarLocale =
    calendarLocales[i18n.language as keyof typeof calendarLocales] ?? enUS

  return (
    <div className='mt-4 flex flex-wrap items-center gap-3'>
      {props.showGranularity ? (
        <Select
          onValueChange={(value) => {
            if (!value) return
            const timeGranularity = value as TimeGranularity
            const next = buildDefaultDashboardFilters({
              ...getSavedChartPreferences(),
              defaultTimeGranularity: timeGranularity,
            })
            props.onFiltersChange({
              ...props.filters,
              ...next,
              modelName: props.filters.modelName,
              time_granularity: timeGranularity,
            })
          }}
          value={granularity}
        >
          <SelectTrigger
            aria-label={t('Time')}
            className={cn(analyticsControlClass, 'w-[8rem]')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {TIME_GRANULARITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.label)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : null}

      <AnalyticsDateRangeField
        calendarLocale={calendarLocale}
        onSelect={(range) => {
          if (!range?.from) return
          props.onFiltersChange({
            ...props.filters,
            start_timestamp: getStartOfDay(range.from),
            end_timestamp: getEndOfDay(range.to ?? range.from),
          })
        }}
        selected={{
          from: props.filters.start_timestamp,
          to: props.filters.end_timestamp,
        }}
      />

      <Select
        onValueChange={(value) => {
          props.onFiltersChange({
            ...props.filters,
            modelName: value === ALL_MODELS || !value ? '' : value,
          })
        }}
        value={props.filters.modelName || ALL_MODELS}
      >
        <SelectTrigger
          aria-label={t('All Models')}
          className={cn(analyticsControlClass, 'min-w-[12rem]')}
        >
          <SelectValue placeholder={t('All Models')} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={ALL_MODELS}>{t('All Models')}</SelectItem>
            {props.models.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export function AnalyticsDateRangeField(props: {
  calendarLocale: typeof enUS
  onSelect: (range: DateRange | undefined) => void
  selected: DateRange
}) {
  const start = props.selected.from
    ? dayjs(props.selected.from).format('YYYY-MM-DD')
    : '—'
  const end = props.selected.to
    ? dayjs(props.selected.to).format('YYYY-MM-DD')
    : start

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            className={cn(
              analyticsControlClass,
              'text-foreground min-w-[20rem] justify-start px-3 font-normal'
            )}
            variant='outline'
          />
        }
      >
        <CalendarIcon className='text-[#999999] size-3.5' />
        <span>
          {start} — {end}
        </span>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <Calendar
          captionLayout='dropdown'
          disabled={(date: Date) =>
            date > new Date() || date < new Date('1900-01-01')
          }
          locale={props.calendarLocale}
          mode='range'
          numberOfMonths={2}
          onSelect={props.onSelect}
          selected={props.selected}
        />
      </PopoverContent>
    </Popover>
  )
}
