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

import {
  getModelCapabilities,
  getPlaygroundModelCard,
  getPlaygroundSpecValueLabel,
  modelSupportsWebSearch,
} from '../playground-model-utils'

describe('playground model utils', () => {
  test('detects web search support from model capabilities', () => {
    const models = [
      {
        label: 'gpt-4o',
        value: 'gpt-4o',
        capabilities: ['web_search', 'tools'],
      },
      {
        label: 'gpt-3.5',
        value: 'gpt-3.5',
        capabilities: ['tools'],
      },
    ]

    expect(getModelCapabilities(models, 'gpt-4o')).toEqual([
      'web_search',
      'tools',
    ])
    expect(modelSupportsWebSearch(models, 'gpt-4o')).toBe(true)
    expect(modelSupportsWebSearch(models, 'gpt-3.5')).toBe(false)
    expect(modelSupportsWebSearch(models, 'missing')).toBe(false)
  })

  test('builds a model card from known metadata and skips empty specs', () => {
    const card = getPlaygroundModelCard(
      [
        {
          capabilities: ['web_search', 'tools'],
          icon: 'OpenAI.Color',
          inputModalities: ['text', 'image'],
          label: 'gpt-4o',
          outputModalities: ['text'],
          supportedEndpointTypes: ['openai'],
          value: 'gpt-4o',
          vendorName: 'OpenAI',
        },
      ],
      'gpt-4o'
    )

    expect(card).toEqual({
      icon: 'OpenAI.Color',
      label: 'gpt-4o',
      specs: [
        { labelKey: 'Input', values: ['text', 'image'] },
        { labelKey: 'Output', values: ['text'] },
        { labelKey: 'Capabilities', values: ['web_search', 'tools'] },
        { labelKey: 'Protocols', values: ['openai'] },
      ],
      value: 'gpt-4o',
      vendorName: 'OpenAI',
    })
    expect(getPlaygroundSpecValueLabel('web_search')).toBe('Web search')
    expect(getPlaygroundModelCard([], 'gpt-4o')).toBeNull()
  })
})
