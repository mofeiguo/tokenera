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

import { ANALYTICS_NAV_ITEMS, ANALYTICS_NAV_URLS } from '../nav'
import {
  ANALYTICS_DEFAULT_SECTION,
  ANALYTICS_SECTION_IDS,
} from '../section-registry'

describe('analytics navigation', () => {
  test('keeps logs, cost, and usage as analysis section items', () => {
    expect(ANALYTICS_NAV_ITEMS.map((item) => item.titleKey)).toEqual([
      'Logs',
      'Cost',
      'Usage',
    ])
    expect(ANALYTICS_NAV_URLS).toEqual([
      '/analytics/logs',
      '/analytics/cost',
      '/analytics/usage',
    ])
  })

  test('opens the logs page when entering analysis', () => {
    expect(ANALYTICS_DEFAULT_SECTION).toBe('logs')
    expect(ANALYTICS_SECTION_IDS).toEqual(['logs', 'cost', 'usage'])
  })
})
