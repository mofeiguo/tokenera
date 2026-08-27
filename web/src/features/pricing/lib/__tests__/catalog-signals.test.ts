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
  formatCatalogTokenCount,
  getCatalogCapabilityKeys,
} from '../catalog-signals'

describe('formatCatalogTokenCount', () => {
  test('returns an empty string for missing or non-positive values', () => {
    expect(formatCatalogTokenCount()).toBe('')
    expect(formatCatalogTokenCount(0)).toBe('')
    expect(formatCatalogTokenCount(-128)).toBe('')
  })

  test('formats thousands and millions with compact suffixes', () => {
    expect(formatCatalogTokenCount(128_000)).toBe('128K')
    expect(formatCatalogTokenCount(1_000_000)).toBe('1M')
    expect(formatCatalogTokenCount(512)).toBe('512')
  })
})

describe('getCatalogCapabilityKeys', () => {
  test('derives vision and generation chips from modalities, not tags', () => {
    expect(
      getCatalogCapabilityKeys({
        input_modalities: ['text', 'image'],
        output_modalities: ['text', 'image', 'video', 'audio'],
      })
    ).toEqual([
      'vision',
      'image_generation',
      'video_generation',
      'speech_generation',
    ])
  })

  test('maps protocol capabilities without mixing in streaming or system prompt', () => {
    expect(
      getCatalogCapabilityKeys({
        capabilities: [
          'function_calling',
          'reasoning',
          'json_mode',
          'structured_output',
          'web_search',
          'code_interpreter',
          'caching',
          'embeddings',
          'streaming',
          'system_prompt',
        ],
      })
    ).toEqual([
      'tools',
      'reasoning',
      'json_mode',
      'structured_output',
      'web_search',
      'code_interpreter',
      'caching',
      'embeddings',
    ])
  })

  test('treats tools and function calling as the same chip', () => {
    expect(
      getCatalogCapabilityKeys({
        capabilities: ['tools'],
      })
    ).toEqual(['tools'])
  })
})
