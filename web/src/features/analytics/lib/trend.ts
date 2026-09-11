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
import type { QuotaDataItem } from '@/features/dashboard/types'
import { quotaUnitsToDollars } from '@/lib/format'
import { formatChartTime, type TimeGranularity } from '@/lib/time'

export type AnalyticsTrendMetric = 'tokens' | 'quota'

export type AnalyticsTrendPoint = {
  Time: string
  Model: string
  Value: number
}

export function filterQuotaByModel(
  data: QuotaDataItem[],
  modelName?: string
): QuotaDataItem[] {
  const model = modelName?.trim()
  if (!model) return data
  return data.filter((item) => (item.model_name?.trim() || 'Unknown') === model)
}

export function buildAnalyticsTrend(
  data: QuotaDataItem[],
  granularity: TimeGranularity,
  metric: AnalyticsTrendMetric
): AnalyticsTrendPoint[] {
  const grouped = new Map<
    string,
    { time: string; ts: number; model: string; value: number }
  >()

  for (const item of data) {
    const ts = Number(item.created_at) || 0
    const time = formatChartTime(ts, granularity)
    const model = item.model_name?.trim() || 'Unknown'
    const raw =
      metric === 'tokens'
        ? Number(item.token_used) || 0
        : Number(item.quota) || 0
    const value = metric === 'quota' ? quotaUnitsToDollars(raw) : raw
    const key = `${time}\0${model}`
    const current = grouped.get(key)
    if (current) {
      current.value += value
      current.ts = Math.min(current.ts, ts)
      continue
    }
    grouped.set(key, { time, ts, model, value })
  }

  return [...grouped.values()]
    .sort((left, right) => left.ts - right.ts || left.model.localeCompare(right.model))
    .map((item) => ({
      Time: item.time,
      Model: item.model,
      Value: item.value,
    }))
}
