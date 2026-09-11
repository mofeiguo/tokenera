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
import type { Row } from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import type { Model, Vendor } from '../../types'

vi.mock('@/lib/lobe-icon', () => ({
  getLobeIcon: () => <span data-testid='vendor-icon' />,
}))

const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { ModelCard } = await import('../model-card')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        Context: 'Context',
        'Max output': 'Max output',
        'Bound Channels': 'Bound Channels',
        'Copy model name': 'Copy model name',
        'Copied!': 'Copied!',
        'No bindings': 'No bindings',
        '{{count}} channel(s)': '{{count}} channel(s)',
        Vision: 'Vision',
        'Supports {{capability}}': 'Supports {{capability}}',
      },
    },
  },
})

function createRow(model: Model): Row<Model> {
  return {
    original: model,
    getAllCells: () => [],
  } as Row<Model>
}

function renderCard(model: Model, vendor?: Vendor) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ModelCard row={createRow(model)} vendor={vendor} />
    </I18nextProvider>
  )
}

describe('ModelCard', () => {
  test('shows model name and vendor metadata without duplicate vendor badge row', () => {
    renderCard(
      {
        id: 1,
        model_name: 'deepseek-v4-flash-vision-exp',
        status: 1,
        created_time: 0,
        updated_time: 0,
        name_rule: 0,
        context_length: 1024,
        max_output_tokens: 16384,
        input_modalities: ['text', 'image'],
        capabilities: ['tools'],
        bound_channels: [{ id: 1, name: 'Main', type: 1, enabled: true }],
      },
      {
        id: 10,
        name: 'DeepSeek',
        icon: 'DeepSeek',
        status: 1,
        created_time: 0,
        updated_time: 0,
      }
    )

    expect(
      screen.getByRole('heading', { name: 'deepseek-v4-flash-vision-exp' })
    ).toHaveClass('line-clamp-2', 'break-all')
    expect(screen.getByText(/DeepSeek · Context 1K · Max output 16.4K/)).toBeInTheDocument()
    expect(screen.getByTestId('vendor-icon')).toBeInTheDocument()
    expect(screen.queryByText('DeepSeek', { selector: '[data-slot="provider-badge"]' })).not.toBeInTheDocument()
  })

  test('falls back to model initial when vendor icon is missing', () => {
    renderCard({
      id: 2,
      model_name: 'custom-model',
      status: 1,
      created_time: 0,
      updated_time: 0,
      name_rule: 0,
    })

    expect(screen.getByText('C')).toBeInTheDocument()
    expect(screen.queryByTestId('vendor-icon')).not.toBeInTheDocument()
  })
})
