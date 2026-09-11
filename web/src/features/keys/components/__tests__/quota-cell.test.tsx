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

import type { ApiKey } from '../../types'

const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { QuotaCell } = await import('../api-keys-cells')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        Unlimited: 'Unlimited',
        'Used:': 'Used:',
        'Remaining:': 'Remaining:',
        'Total:': 'Total:',
      },
    },
  },
})

function createApiKey(overrides: Partial<ApiKey> = {}): ApiKey {
  return {
    id: 1,
    name: 'Key',
    key: 'masked',
    status: 1,
    remain_quota: 80,
    used_quota: 20,
    unlimited_quota: false,
    expired_time: -1,
    created_time: 1,
    accessed_time: 1,
    model_limits_enabled: false,
    model_limits: '',
    allow_ips: '',
    ...overrides,
  }
}

function renderQuota(apiKey: ApiKey, className?: string) {
  return render(
    <I18nextProvider i18n={i18n}>
      <QuotaCell apiKey={apiKey} className={className} />
    </I18nextProvider>
  )
}

describe('QuotaCell', () => {
  test('shows unlimited as plain text in the compact card layout', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <QuotaCell
          apiKey={createApiKey({ unlimited_quota: true, used_quota: 40 })}
          compact
        />
      </I18nextProvider>
    )
    expect(screen.getByText('Unlimited')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Unlimited/ })
    ).not.toBeInTheDocument()
  })

  test('shows an unlimited badge when the key has no quota cap', () => {
    renderQuota(createApiKey({ unlimited_quota: true, used_quota: 40 }))

    expect(
      screen.getByRole('button', { name: /Unlimited/ })
    ).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  test('renders a remaining-quota bar that can stretch to the card width', () => {
    renderQuota(createApiKey({ remain_quota: 80, used_quota: 20 }), 'w-full')

    const progress = screen.getByRole('progressbar')
    const quotaCell = progress.closest('[data-slot=quota-cell]')
    expect(quotaCell).toHaveClass('w-full')
    expect(progress).toBeInTheDocument()
  })

  test('uses the destructive indicator when remaining quota is at or below 10%', () => {
    renderQuota(createApiKey({ remain_quota: 5, used_quota: 95 }))

    expect(screen.getByRole('progressbar')).toHaveClass(
      '[&_[data-slot=progress-indicator]]:bg-destructive'
    )
  })
})
