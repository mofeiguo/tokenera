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
import { describe, expect, test } from 'vitest'

import { formatChartTime } from '@/lib/time'

import { buildAnalyticsTrend, filterQuotaByModel } from '../trend'

const rows = [
  {
    created_at: 1_700_000_000,
    model_name: 'gpt-5',
    quota: 100,
    token_used: 20,
    count: 1,
  },
  {
    created_at: 1_700_000_000,
    model_name: 'claude',
    quota: 40,
    token_used: 8,
    count: 1,
  },
  {
    created_at: 1_700_003_600,
    model_name: 'gpt-5',
    quota: 50,
    token_used: 10,
    count: 1,
  },
]

describe('analytics trend', () => {
  test('filters quota rows by model name', () => {
    expect(filterQuotaByModel(rows, 'gpt-5')).toHaveLength(2)
    expect(filterQuotaByModel(rows, '')).toHaveLength(3)
  })

  test('groups token usage by chart time and model', () => {
    const points = buildAnalyticsTrend(rows, 'hour', 'tokens')
    const firstBucket = formatChartTime(1_700_000_000, 'hour')
    const gpt = points.find(
      (point) => point.Time === firstBucket && point.Model === 'gpt-5'
    )

    expect(gpt?.Value).toBe(20)
    expect(points).toHaveLength(3)
  })
})
