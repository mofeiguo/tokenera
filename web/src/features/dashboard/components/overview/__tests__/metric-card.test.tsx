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
import { CreditCard } from 'lucide-react'
import { describe, expect, test } from 'vitest'

import { MetricCard } from '../metric-card'

describe('MetricCard', () => {
  test('renders the label, value, and subtitle', () => {
    render(
      <MetricCard
        label='Credit remaining'
        value='$12.00'
        subtitle='Available balance'
        icon={<CreditCard data-testid='metric-icon' />}
        accent='blue'
      />
    )

    expect(screen.getByText('Credit remaining')).toBeInTheDocument()
    expect(screen.getByText('$12.00')).toBeInTheDocument()
    expect(screen.getByText('Available balance')).toBeInTheDocument()
  })

  test('renders a sparkline for non-zero trend data', () => {
    const { container } = render(
      <MetricCard
        label='Total Requests'
        value='9'
        trend={[1, 2, 4, 3, 6]}
        accent='purple'
      />
    )

    expect(container.querySelector('svg')).not.toBeNull()
  })
})
