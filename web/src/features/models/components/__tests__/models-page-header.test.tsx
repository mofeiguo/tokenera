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

const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { ModelsProvider } = await import('../models-provider')
const { ModelsPageHeader } = await import('../models-page-header')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        Models: 'Models',
        'Manage catalog models, vendors, and channel bindings.':
          'Manage catalog models, vendors, and channel bindings.',
        'Add Model': 'Add Model',
        'Sync Upstream': 'Sync Upstream',
        More: 'More',
        'Manage Vendors': 'Manage Vendors',
      },
    },
  },
})

describe('Models page header', () => {
  test('renders the directory title, description, and add action', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ModelsProvider>
          <ModelsPageHeader />
        </ModelsProvider>
      </I18nextProvider>
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Models' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('Manage catalog models, vendors, and channel bindings.')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Add Model' })
    ).toBeInTheDocument()
  })
})
