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
const { ApiKeysProvider } = await import('../api-keys-provider')
const { ApiKeyRow } = await import('../api-key-row')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        Enabled: 'Enabled',
        Disabled: 'Disabled',
        Expired: 'Expired',
        Unused: 'Unused',
        'Never expires': 'Never expires',
        'All Models': 'All Models',
        Unlimited: 'Unlimited',
        'Copy API key': 'Copy API key',
        'Reveal full API key': 'Reveal full API key',
        Edit: 'Edit',
        'Open menu': 'Open menu',
      },
    },
  },
})

function createApiKey(name: string, status = 1): ApiKey {
  return {
    id: 1,
    name,
    key: 'masked',
    status,
    remain_quota: 100,
    used_quota: 20,
    unlimited_quota: false,
    expired_time: -1,
    created_time: 1,
    accessed_time: 0,
    model_limits_enabled: false,
    model_limits: '',
    allow_ips: '',
  }
}

function renderRow(name: string, status = 1) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ApiKeysProvider>
        <table>
          <tbody>
            <ApiKeyRow apiKey={createApiKey(name, status)} now={Date.now()} />
          </tbody>
        </table>
      </ApiKeysProvider>
    </I18nextProvider>
  )
}

describe('ApiKeyRow', () => {
  test('shows name, key, and metadata in a single list row', () => {
    renderRow('Production key')

    const heading = screen.getByRole('heading', { name: 'Production key' })
    expect(heading).toHaveClass('truncate')
    expect(screen.getByText('sk-masked')).toBeInTheDocument()
    expect(screen.getByLabelText('Enabled')).toBeInTheDocument()
    expect(screen.queryByText('Enabled')).not.toBeInTheDocument()
    expect(screen.getByText('Unused')).toBeInTheDocument()
    expect(screen.getByText('Never expires')).toBeInTheDocument()
    expect(screen.getByText('All Models')).toBeInTheDocument()
  })

  test('shows restricted models on the list row', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ApiKeysProvider>
          <table>
            <tbody>
              <ApiKeyRow
                apiKey={{
                  ...createApiKey('Limited key'),
                  model_limits_enabled: true,
                  model_limits: 'gpt-4o,claude-sonnet',
                }}
                now={Date.now()}
              />
            </tbody>
          </table>
        </ApiKeysProvider>
      </I18nextProvider>
    )

    expect(screen.getByText('gpt-4o, claude-sonnet')).toBeInTheDocument()
    expect(screen.queryByText('All Models')).not.toBeInTheDocument()
  })

  test('marks a disabled key without treating it as selected bulk state', () => {
    const { container } = renderRow('Disabled key', 2)

    expect(container.querySelector('[data-status]')).toHaveAttribute(
      'data-status',
      'disabled'
    )
    expect(screen.getByText('Disabled')).toBeInTheDocument()
  })

  test('shows an expired status label on the row', () => {
    renderRow('Expired key', 3)

    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  test('truncates a long API key name', () => {
    renderRow(
      'very-long-production-api-key-name-that-should-not-break-the-row'
    )

    expect(
      screen.getByRole('heading', {
        name: 'very-long-production-api-key-name-that-should-not-break-the-row',
      })
    ).toHaveClass('truncate')
  })
})
