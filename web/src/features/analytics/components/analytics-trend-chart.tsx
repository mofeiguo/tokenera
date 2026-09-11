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
import { VChart } from '@visactor/react-vchart'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { getDashboardChartColors } from '@/features/dashboard/lib/charts'
import type { QuotaDataItem } from '@/features/dashboard/types'
import type { TimeGranularity } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useChartTheme } from '@/lib/use-chart-theme'
import { VCHART_OPTION } from '@/lib/vchart'

import { buildAnalyticsTrend, type AnalyticsTrendMetric } from '../lib/trend'
import { analyticsCardClass } from './analytics-styles'

type AnalyticsTrendChartProps = {
  data: QuotaDataItem[]
  metric: AnalyticsTrendMetric
  timeGranularity: TimeGranularity
  title: string
}

export function AnalyticsTrendChart(props: AnalyticsTrendChartProps) {
  const { t } = useTranslation()
  const { resolvedTheme, themeReady } = useChartTheme()
  const points = useMemo(
    () =>
      buildAnalyticsTrend(props.data, props.timeGranularity, props.metric),
    [props.data, props.metric, props.timeGranularity]
  )
  const models = useMemo(
    () => [...new Set(points.map((point) => point.Model))],
    [points]
  )
  const spec = useMemo(
    () => ({
      type: props.timeGranularity === 'hour' ? 'line' : 'bar',
      autoFit: true,
      data: [{ id: 'trend', values: points }],
      xField: 'Time',
      yField: 'Value',
      seriesField: 'Model',
      point: { visible: false },
      line: { style: { curveType: 'monotone', lineWidth: 2 } },
      bar: { style: { width: 8 } },
      color: getDashboardChartColors(models.length),
      legends: {
        visible: models.length > 0,
        orient: 'top',
        position: 'start',
        item: { label: { style: { fontSize: 12, fill: '#666666' } } },
      },
      axes: [
        {
          orient: 'bottom',
          label: { style: { fontSize: 11, fill: '#999999' } },
        },
        {
          orient: 'left',
          label: { style: { fontSize: 11, fill: '#999999' } },
        },
      ],
      tooltip: {
        mark: { visible: true },
      },
    }),
    [models.length, points, props.timeGranularity]
  )

  let chart = (
    <VChart
      key={`${props.metric}-${props.timeGranularity}-${points.length}-${resolvedTheme}`}
      option={VCHART_OPTION}
      spec={spec}
    />
  )
  if (!themeReady) {
    chart = <div className='h-full' />
  } else if (points.length === 0) {
    chart = (
      <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>
        {t('No data')}
      </div>
    )
  }

  return (
    <section className={cn(analyticsCardClass, 'min-w-0 px-6 py-5')}>
      <h2 className='text-[14px] font-semibold text-[#333333] dark:text-foreground'>
        {props.title}
      </h2>
      <div className='mt-4 h-[280px]'>{chart}</div>
    </section>
  )
}
