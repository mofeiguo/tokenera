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
  CAPABILITY_FILTERS,
  ENDPOINT_TYPES,
  FILTER_ALL,
  MODEL_INTENTS,
  QUOTA_TYPES,
  SORT_OPTIONS,
} from '../../constants'
import type { PricingModel } from '../../types'
import {
  filterAndSortModels,
  filterByCapability,
  filterByModelIntent,
} from '../filters'

function model(
  name: string,
  endpoints: string[],
  vendor = 'Acme'
): PricingModel {
  return {
    id: name.length,
    model_name: name,
    vendor_name: vendor,
    quota_type: 0,
    model_ratio: 1,
    completion_ratio: 1,
    enable_groups: ['default'],
    supported_endpoint_types: endpoints,
  }
}

const models = [
  model('openai-chat', [ENDPOINT_TYPES.OPENAI], 'OpenAI'),
  model('responses-chat', [ENDPOINT_TYPES.OPENAI_RESPONSE], 'OpenAI'),
  model('anthropic-chat', [ENDPOINT_TYPES.ANTHROPIC], 'Anthropic'),
  model('gemini-chat', [ENDPOINT_TYPES.GEMINI], 'Google'),
  model('image-model', [ENDPOINT_TYPES.IMAGE_GENERATION], 'OpenAI'),
  model('video-model', [ENDPOINT_TYPES.OPENAI_VIDEO], 'OpenAI'),
  model('embedding-model', [ENDPOINT_TYPES.EMBEDDINGS], 'OpenAI'),
  model('rerank-model', [ENDPOINT_TYPES.JINA_RERANK], 'Jina'),
]

describe('pricing model intent filters', () => {
  test('groups all chat-compatible protocols under the Chat intent', () => {
    expect(
      filterByModelIntent(models, MODEL_INTENTS.CHAT).map(
        (item) => item.model_name
      )
    ).toEqual([
      'openai-chat',
      'responses-chat',
      'anthropic-chat',
      'gemini-chat',
    ])
  })

  test.each([
    [MODEL_INTENTS.IMAGE, 'image-model'],
    [MODEL_INTENTS.VIDEO, 'video-model'],
    [MODEL_INTENTS.EMBEDDINGS, 'embedding-model'],
    [MODEL_INTENTS.RERANK, 'rerank-model'],
  ])('maps the %s intent to its consumer category', (intent, expected) => {
    expect(filterByModelIntent(models, intent)).toHaveLength(1)
    expect(filterByModelIntent(models, intent)[0]?.model_name).toBe(expected)
  })

  test('combines the consumer intent with advanced filters', () => {
    const result = filterAndSortModels(models, {
      search: '',
      intent: MODEL_INTENTS.CHAT,
      vendor: 'OpenAI',
      group: FILTER_ALL,
      quotaType: QUOTA_TYPES.ALL,
      endpointType: ENDPOINT_TYPES.ALL,
      tag: FILTER_ALL,
      capability: CAPABILITY_FILTERS.ALL,
      sortBy: SORT_OPTIONS.NAME,
    })

    expect(result.map((item) => item.model_name)).toEqual([
      'openai-chat',
      'responses-chat',
    ])
  })

  test('derives Vision and Tools filters from structured catalog metadata', () => {
    const catalogModels = [
      {
        ...model('vision-model', [ENDPOINT_TYPES.OPENAI]),
        input_modalities: ['text', 'image'] as PricingModel['input_modalities'],
      },
      {
        ...model('tools-model', [ENDPOINT_TYPES.OPENAI]),
        capabilities: ['function_calling'] as PricingModel['capabilities'],
      },
    ]

    expect(
      filterByCapability(catalogModels, CAPABILITY_FILTERS.VISION).map(
        (item) => item.model_name
      )
    ).toEqual(['vision-model'])
    expect(
      filterByCapability(catalogModels, CAPABILITY_FILTERS.TOOLS).map(
        (item) => item.model_name
      )
    ).toEqual(['tools-model'])
  })
})
