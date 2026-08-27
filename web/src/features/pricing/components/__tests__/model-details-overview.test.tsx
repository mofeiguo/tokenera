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
import { describe, expect, test, vi } from 'vitest'

import type { PricingModel } from '../../types'

vi.mock('@/lib/lobe-icon', () => ({
  getLobeIcon: () => null,
}))

const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { TooltipProvider } = await import('@/components/ui/tooltip')
const { ModelDetailsContent } = await import('../model-details')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        Overview: 'Overview',
        API: 'API',
        Context: 'Context',
        'Max output': 'Max output',
        Modalities: 'Modalities',
        Text: 'Text',
        Image: 'Image',
        Parameters: 'Parameters',
        Pricing: 'Pricing',
        Input: 'Input',
        Cached: 'Cached',
        Output: 'Output',
        'Token-based': 'Token-based',
        'Copy model name': 'Copy model name',
        'Copied!': 'Copied!',
        Vision: 'Vision',
        'Model capabilities': 'Model capabilities',
        Tools: 'Tools',
        'Supports {{capability}}': 'Supports {{capability}}',
      },
    },
  },
})

function createModel(overrides: Partial<PricingModel> = {}): PricingModel {
  return {
    id: 1,
    model_name: 'gpt-test',
    description: 'A compact catalog model used in overview tests.',
    vendor_name: 'OpenAI',
    quota_type: 0,
    model_ratio: 1,
    completion_ratio: 2,
    cache_ratio: 0.5,
    enable_groups: [],
    tags: 'preview',
    supported_endpoint_types: ['openai-response'],
    context_length: 128_000,
    max_output_tokens: 16_000,
    parameter_count: '8B',
    input_modalities: ['text', 'image'],
    output_modalities: ['text'],
    capabilities: ['tools'],
    ...overrides,
  }
}

function OverviewHarness(props: { model?: PricingModel }) {
  return (
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>
        <ModelDetailsContent
          model={props.model ?? createModel()}
          endpointMap={{}}
          priceRate={1}
          usdExchangeRate={1}
          tokenUnit='M'
        />
      </TooltipProvider>
    </I18nextProvider>
  )
}

describe('model details overview', () => {
  test('shows overview and API tabs without a performance tab', () => {
    render(<OverviewHarness />)

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'API' })).toBeInTheDocument()
    expect(
      screen.queryByRole('tab', { name: /performance/i })
    ).not.toBeInTheDocument()
  })

  test('renders identity, description, spec rows, and a single pricing sheet', () => {
    render(<OverviewHarness />)

    expect(
      screen.getByRole('heading', { name: 'gpt-test' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('A compact catalog model used in overview tests.')
    ).toBeInTheDocument()

    const specs = document.querySelector('[data-slot="model-overview-specs"]')
    expect(specs).not.toBeNull()
    expect(specs).toHaveTextContent('Context')
    expect(specs).toHaveTextContent('128K')
    expect(specs).toHaveTextContent('Model capabilities')
    expect(specs).toHaveTextContent('Tools')
    expect(specs).toHaveTextContent('Max output')
    expect(specs).toHaveTextContent('16K')
    expect(specs).not.toHaveTextContent('Modalities')
    expect(specs).not.toHaveTextContent('Tags')
    expect(specs).not.toHaveTextContent('preview')
    expect(specs).toHaveTextContent('8B')
    expect(specs).not.toHaveTextContent('openai-response')

    const modalities = document.querySelector(
      '[data-slot="model-overview-modalities"]'
    )
    expect(modalities).not.toBeNull()
    expect(modalities).toHaveTextContent('Modalities')
    expect(
      screen.getByRole('img', { name: 'Input · Image' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Input · Text' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Output · Text' })
    ).toBeInTheDocument()

    const pricing = document.querySelector(
      '[data-slot="model-overview-pricing"]'
    )
    expect(pricing).not.toBeNull()
    expect(pricing).toHaveTextContent('Input')
    expect(pricing).toHaveTextContent('Cached')
    expect(pricing).toHaveTextContent('Output')
    expect(pricing?.querySelectorAll(':scope > div')).toHaveLength(1)
  })

  test('keeps the spec list stacked as labeled rows instead of a mosaic grid', () => {
    render(<OverviewHarness />)

    const specs = document.querySelector('[data-slot="model-overview-specs"]')
    expect(specs).toHaveClass('divide-y')
    expect(specs).not.toHaveClass('grid-cols-2')
    expect(specs).not.toHaveClass('grid-cols-5')
  })
})
