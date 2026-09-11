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
import { safeDivide } from '@/features/dashboard/lib'
import type { QuotaDataItem } from '@/features/dashboard/types'

import { filterQuotaByModel } from './trend'

export type AnalyticsTotals = {
  totalQuota: number
  totalCount: number
  totalTokens: number
  avgQuotaPerRequest: number
  avgQuotaPerMillionTokens: number
  avgTokensPerRequest: number
}

export type ModelBreakdownRow = {
  model: string
  quota: number
  tokens: number
  count: number
}

export function computeAnalyticsTotals(
  data: QuotaDataItem[],
  modelName?: string
): AnalyticsTotals {
  return computeFilteredAnalyticsTotals(filterQuotaByModel(data, modelName))
}

function computeFilteredAnalyticsTotals(data: QuotaDataItem[]): AnalyticsTotals {
  const totals = data.reduce(
    (acc, item) => ({
      totalQuota: acc.totalQuota + (Number(item.quota) || 0),
      totalCount: acc.totalCount + (Number(item.count) || 0),
      totalTokens: acc.totalTokens + (Number(item.token_used) || 0),
    }),
    { totalQuota: 0, totalCount: 0, totalTokens: 0 }
  )

  return {
    ...totals,
    avgQuotaPerRequest: safeDivide(totals.totalQuota, totals.totalCount, 6),
    avgQuotaPerMillionTokens: safeDivide(
      totals.totalQuota,
      totals.totalTokens / 1_000_000,
      6
    ),
    avgTokensPerRequest: safeDivide(totals.totalTokens, totals.totalCount, 2),
  }
}

export function computeModelBreakdown(
  data: QuotaDataItem[],
  modelName?: string
): ModelBreakdownRow[] {
  return computeFilteredModelBreakdown(filterQuotaByModel(data, modelName))
}

function computeFilteredModelBreakdown(
  data: QuotaDataItem[]
): ModelBreakdownRow[] {
  const byModel = new Map<string, ModelBreakdownRow>()

  for (const item of data) {
    const model = item.model_name?.trim() || 'Unknown'
    const current = byModel.get(model) ?? {
      model,
      quota: 0,
      tokens: 0,
      count: 0,
    }
    current.quota += Number(item.quota) || 0
    current.tokens += Number(item.token_used) || 0
    current.count += Number(item.count) || 0
    byModel.set(model, current)
  }

  return [...byModel.values()].sort((left, right) => right.quota - left.quota)
}
