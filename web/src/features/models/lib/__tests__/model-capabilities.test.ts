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
  countModelsWithCapability,
  formatModelTokenCount,
  getModelCapabilityKeys,
} from '../model-capabilities'

describe('getModelCapabilityKeys', () => {
  test('maps image input and function calling to vision and tools', () => {
    expect(
      getModelCapabilityKeys({
        input_modalities: ['text', 'image'],
        output_modalities: ['text'],
        capabilities: ['function_calling'],
      })
    ).toEqual(['vision', 'tools'])
  })

  test('does not treat a vendor list as nested provider capabilities', () => {
    expect(
      getModelCapabilityKeys({
        input_modalities: ['text'],
        output_modalities: ['text'],
        capabilities: ['reasoning'],
      })
    ).toEqual(['reasoning'])
  })
})

describe('countModelsWithCapability', () => {
  test('counts only models that expose the requested capability', () => {
    const models = [
      {
        input_modalities: ['image' as const],
        output_modalities: ['text' as const],
        capabilities: [],
      },
      {
        input_modalities: ['text' as const],
        output_modalities: ['text' as const],
        capabilities: ['tools' as const],
      },
    ]

    expect(countModelsWithCapability(models, 'vision')).toBe(1)
    expect(countModelsWithCapability(models, 'tools')).toBe(1)
  })
})

describe('formatModelTokenCount', () => {
  test('formats thousands and millions with a compact suffix', () => {
    expect(formatModelTokenCount(128000)).toBe('128K')
    expect(formatModelTokenCount(1_000_000)).toBe('1M')
  })
})
