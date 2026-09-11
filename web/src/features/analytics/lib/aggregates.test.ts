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

import {
  computeAnalyticsTotals,
  computeModelBreakdown,
} from './aggregates'

describe('analytics aggregates', () => {
  test('sums quota, tokens, and requests without mixing empty rows', () => {
    const totals = computeAnalyticsTotals([
      {
        created_at: 1,
        model_name: 'gpt-5',
        quota: 1000,
        token_used: 200,
        count: 2,
      },
      {
        created_at: 2,
        model_name: 'claude',
        quota: 500,
        token_used: 50,
        count: 1,
      },
    ])

    expect(totals.totalQuota).toBe(1500)
    expect(totals.totalTokens).toBe(250)
    expect(totals.totalCount).toBe(3)
    expect(totals.avgQuotaPerRequest).toBe(500)
    expect(totals.avgTokensPerRequest).toBe(83.33)
  })

  test('returns zeros when there is no data', () => {
    expect(computeAnalyticsTotals([])).toEqual({
      totalQuota: 0,
      totalCount: 0,
      totalTokens: 0,
      avgQuotaPerRequest: 0,
      avgQuotaPerMillionTokens: 0,
      avgTokensPerRequest: 0,
    })
  })

  test('limits totals to the selected model', () => {
    const totals = computeAnalyticsTotals(
      [
        {
          created_at: 1,
          model_name: 'gpt-5',
          quota: 1000,
          token_used: 200,
          count: 2,
        },
        {
          created_at: 2,
          model_name: 'claude',
          quota: 500,
          token_used: 50,
          count: 1,
        },
      ],
      'gpt-5'
    )

    expect(totals.totalQuota).toBe(1000)
    expect(totals.totalTokens).toBe(200)
    expect(totals.totalCount).toBe(2)
  })

  test('groups by model and sorts by quota', () => {
    const rows = computeModelBreakdown([
      {
        created_at: 1,
        model_name: 'cheap',
        quota: 10,
        token_used: 10,
        count: 1,
      },
      {
        created_at: 2,
        model_name: 'expensive',
        quota: 80,
        token_used: 8,
        count: 1,
      },
      {
        created_at: 3,
        model_name: 'cheap',
        quota: 5,
        token_used: 5,
        count: 1,
      },
    ])

    expect(rows.map((row) => row.model)).toEqual(['expensive', 'cheap'])
    expect(rows[1]).toMatchObject({ model: 'cheap', quota: 15, tokens: 15, count: 2 })
  })
})
