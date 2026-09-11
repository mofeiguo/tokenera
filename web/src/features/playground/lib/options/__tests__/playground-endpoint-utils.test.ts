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
  getModelEndpointTypes,
  getPlaygroundEndpointLabel,
  getPlaygroundEndpointTypes,
  resolvePlaygroundEndpointType,
} from '../playground-endpoint-utils'

const t = (key: string) => key

describe('getPlaygroundEndpointTypes', () => {
  test('returns chat endpoints when the catalog has not advertised any', () => {
    expect(getPlaygroundEndpointTypes([])).toEqual([
      'openai',
      'openai-response',
      'anthropic',
      'gemini',
    ])
  })

  test('keeps catalog order and drops non-chat endpoints', () => {
    expect(
      getPlaygroundEndpointTypes([
        'anthropic',
        'embeddings',
        'openai',
        'openai',
      ])
    ).toEqual(['anthropic', 'openai'])
  })
})

describe('resolvePlaygroundEndpointType', () => {
  test('defaults to the first available endpoint when the current one is missing', () => {
    expect(
      resolvePlaygroundEndpointType(['anthropic', 'openai'], '')
    ).toBe('anthropic')
  })

  test('keeps the current endpoint when it is still available', () => {
    expect(
      resolvePlaygroundEndpointType(['anthropic', 'openai'], 'openai')
    ).toBe('openai')
  })

  test('falls back to openai when no chat endpoints are advertised', () => {
    expect(resolvePlaygroundEndpointType(['embeddings'], 'gemini')).toBe(
      'openai'
    )
  })
})

describe('getModelEndpointTypes', () => {
  test('hides the selector before models have loaded', () => {
    expect(getModelEndpointTypes([], 'gpt-4o')).toEqual([])
  })
})

describe('getPlaygroundEndpointLabel', () => {
  test('uses ZenMux protocol names', () => {
    expect(getPlaygroundEndpointLabel(t, 'anthropic')).toBe('Anthropic Messages')
    expect(getPlaygroundEndpointLabel(t, 'openai')).toBe(
      'OpenAI Chat Completions'
    )
    expect(getPlaygroundEndpointLabel(t, 'openai-response')).toBe(
      'OpenAI Responses'
    )
    expect(getPlaygroundEndpointLabel(t, 'gemini')).toBe(
      'Gemini Generate Content'
    )
  })
})
