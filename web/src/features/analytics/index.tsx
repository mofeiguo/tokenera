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
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  buildDefaultDashboardFilters,
  getSavedChartPreferences,
} from '@/features/dashboard/lib'
import { formatCompactNumber, formatLogQuota, formatNumber } from '@/lib/format'
import { getRouteApi } from '@/lib/router'

import { AnalyticsFilterBar } from './components/analytics-filter-bar'
import { AnalyticsLogsTable } from './components/analytics-logs-table'
import { AnalyticsMetricRow } from './components/analytics-metric-row'
import { AnalyticsModelTable } from './components/analytics-model-table'
import { AnalyticsPageShell } from './components/analytics-page-shell'
import { AnalyticsTrendChart } from './components/analytics-trend-chart'
import { useAnalyticsData } from './hooks/use-analytics-data'
import { filterQuotaByModel } from './lib/trend'
import {
  ANALYTICS_DEFAULT_SECTION,
  ANALYTICS_SECTION_META,
  isAnalyticsSectionId,
} from './section-registry'
import type { AnalyticsFilters } from './types'

const route = getRouteApi('/_authenticated/analytics/$section')

export function Analytics() {
  const { t } = useTranslation()
  const params = route.useParams()
  const rawSection = params.section ?? ''
  const section = isAnalyticsSectionId(rawSection)
    ? rawSection
    : ANALYTICS_DEFAULT_SECTION
  const [filters, setFilters] = useState<AnalyticsFilters>(() => ({
    ...buildDefaultDashboardFilters(getSavedChartPreferences()),
    modelName: '',
  }))
  const analytics = useAnalyticsData(filters)
  const modelOptions = analytics.allModels.map((row) => row.model)
  const title = t(ANALYTICS_SECTION_META[section].titleKey)
  const chartData = useMemo(
    () => filterQuotaByModel(analytics.data, filters.modelName),
    [analytics.data, filters.modelName]
  )

  const costItems = useMemo(
    () => [
      { label: t('Total Cost'), value: formatLogQuota(analytics.totals.totalQuota) },
      {
        label: t('Average Cost Per Request'),
        value: formatLogQuota(analytics.totals.avgQuotaPerRequest),
      },
      {
        label: t('Average Cost Per Million Tokens'),
        value: formatLogQuota(analytics.totals.avgQuotaPerMillionTokens),
      },
    ],
    [analytics.totals, t]
  )

  const usageItems = useMemo(
    () => [
      {
        label: t('Total Token Usage'),
        value: formatCompactNumber(analytics.totals.totalTokens),
      },
      {
        label: t('Total API Requests'),
        value: formatNumber(analytics.totals.totalCount),
      },
    ],
    [analytics.totals, t]
  )

  let body = (
    <div className='space-y-4'>
      <AnalyticsMetricRow
        isLoading={analytics.isLoading}
        items={section === 'cost' ? costItems : usageItems}
      />
      <AnalyticsTrendChart
        data={chartData}
        metric={section === 'cost' ? 'quota' : 'tokens'}
        timeGranularity={filters.time_granularity ?? 'hour'}
        title={section === 'cost' ? t('Cost by Model') : t('Usage by Model')}
      />
      <AnalyticsModelTable
        metric={section === 'cost' ? 'quota' : 'tokens'}
        rows={analytics.models}
      />
    </div>
  )
  if (section === 'logs') {
    body = (
      <AnalyticsLogsTable
        filters={filters}
        key={`${filters.start_timestamp?.getTime()}-${filters.end_timestamp?.getTime()}-${filters.modelName}`}
      />
    )
  }

  return (
    <AnalyticsPageShell
      onRefresh={() => {
        void analytics.refetch()
      }}
      refreshing={analytics.isLoading}
      title={title}
      toolbar={
        <AnalyticsFilterBar
          filters={filters}
          models={modelOptions}
          onFiltersChange={setFilters}
          showGranularity={section !== 'logs'}
        />
      }
    >
      {body}
    </AnalyticsPageShell>
  )
}
