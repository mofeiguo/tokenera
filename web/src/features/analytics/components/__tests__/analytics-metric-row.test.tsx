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
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { AnalyticsMetricRow } from '../analytics-metric-row'

describe('analytics metric row', () => {
  test('renders available values and an em dash for missing splits', () => {
    render(
      <AnalyticsMetricRow
        items={[
          { label: 'Total Token Usage', value: '8.9K' },
          { label: 'Input Token Usage', value: null },
        ]}
      />
    )

    expect(screen.getByText('Total Token Usage')).toBeInTheDocument()
    expect(screen.getByText('8.9K')).toHaveClass('text-[26px]')
    expect(screen.getByText('8.9K').parentElement).toHaveClass('h-[140px]')
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
