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
  cacheReadPercent,
  latencyMs,
  tokensPerSecond,
} from '../log-metrics'

describe('analytics log metrics', () => {
  test('returns cache read percent from prompt tokens', () => {
    expect(cacheReadPercent(200, 50)).toBe(25)
    expect(cacheReadPercent(0, 50)).toBeNull()
    expect(cacheReadPercent(100, 0)).toBe(0)
  })

  test('returns throughput only when output tokens and duration exist', () => {
    expect(tokensPerSecond(160, 2)).toBe(80)
    expect(tokensPerSecond(160, 0)).toBeNull()
    expect(tokensPerSecond(0, 2)).toBeNull()
  })

  test('converts request duration to milliseconds', () => {
    expect(latencyMs(10.819)).toBe(10819)
    expect(latencyMs(0)).toBeNull()
  })
})
