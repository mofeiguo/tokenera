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
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

import { AnalyticsPageTabs } from '../analytics-page-tabs'

describe('analytics page tabs', () => {
  test('keeps underline tabs from stretching across the toolbar', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()

    render(
      <AnalyticsPageTabs
        onValueChange={onValueChange}
        tabs={[
          { id: 'primary', label: 'Usage' },
          { id: 'models', label: 'Models' },
        ]}
        value='primary'
      />
    )

    const usage = screen.getByRole('tab', { name: 'Usage' })
    expect(usage).toHaveClass('flex-none')
    expect(usage).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('tab', { name: 'Models' }))
    expect(onValueChange).toHaveBeenCalledWith('models')
  })
})
