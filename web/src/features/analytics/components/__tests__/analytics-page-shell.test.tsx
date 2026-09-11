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

const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { AnalyticsPageShell } = await import('../analytics-page-shell')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        Refresh: 'Refresh',
      },
    },
  },
})

describe('analytics page shell', () => {
  test('renders a large title and refresh control without a page description', async () => {
    const onRefresh = vi.fn()
    const user = userEvent.setup()

    render(
      <I18nextProvider i18n={i18n}>
        <AnalyticsPageShell onRefresh={onRefresh} title='Cost Analysis'>
          <div>body</div>
        </AnalyticsPageShell>
      </I18nextProvider>
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Cost Analysis' })
    ).toHaveClass('text-[28px]')
    expect(
      screen.queryByText('Spend in display currency for the selected range.')
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })
})
