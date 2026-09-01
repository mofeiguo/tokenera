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
import type { Model, ModelModality } from '../types'

type ModelCapabilitySource = Pick<
  Model,
  'capabilities' | 'input_modalities' | 'output_modalities'
>

export const MODEL_CAPABILITY_KEYS = [
  'vision',
  'image_generation',
  'video_generation',
  'speech_generation',
  'tools',
  'reasoning',
  'json_mode',
  'structured_output',
  'web_search',
  'code_interpreter',
  'caching',
  'embeddings',
] as const

export type ModelCapabilityKey = (typeof MODEL_CAPABILITY_KEYS)[number]

export const MODEL_CAPABILITY_LABEL_KEYS: Record<ModelCapabilityKey, string> = {
  vision: 'Vision',
  image_generation: 'Image Generation',
  video_generation: 'Video',
  speech_generation: 'Audio',
  tools: 'Tools',
  reasoning: 'Reasoning',
  json_mode: 'JSON mode',
  structured_output: 'Structured output',
  web_search: 'Web search',
  code_interpreter: 'Code interpreter',
  caching: 'Prompt caching',
  embeddings: 'Embeddings',
}

function hasCapability(
  capabilities: readonly string[] | undefined,
  values: readonly string[]
): boolean {
  if (!capabilities) return false
  return capabilities.some((capability) => values.includes(capability))
}

function hasModality(
  modalities: readonly ModelModality[] | undefined,
  value: ModelModality
): boolean {
  return Boolean(modalities?.includes(value))
}

export function getModelCapabilityKeys(
  model: ModelCapabilitySource
): ModelCapabilityKey[] {
  const keys: ModelCapabilityKey[] = []

  if (
    hasModality(model.input_modalities, 'image') ||
    hasCapability(model.capabilities, ['vision'])
  ) {
    keys.push('vision')
  }
  if (hasModality(model.output_modalities, 'image')) {
    keys.push('image_generation')
  }
  if (hasModality(model.output_modalities, 'video')) {
    keys.push('video_generation')
  }
  if (hasModality(model.output_modalities, 'audio')) {
    keys.push('speech_generation')
  }
  if (hasCapability(model.capabilities, ['function_calling', 'tools'])) {
    keys.push('tools')
  }
  if (hasCapability(model.capabilities, ['reasoning'])) {
    keys.push('reasoning')
  }
  if (hasCapability(model.capabilities, ['json_mode'])) {
    keys.push('json_mode')
  }
  if (hasCapability(model.capabilities, ['structured_output'])) {
    keys.push('structured_output')
  }
  if (hasCapability(model.capabilities, ['web_search'])) {
    keys.push('web_search')
  }
  if (hasCapability(model.capabilities, ['code_interpreter'])) {
    keys.push('code_interpreter')
  }
  if (hasCapability(model.capabilities, ['caching'])) {
    keys.push('caching')
  }
  if (hasCapability(model.capabilities, ['embeddings'])) {
    keys.push('embeddings')
  }

  return keys
}

export function countModelsWithCapability(
  models: readonly ModelCapabilitySource[],
  key: ModelCapabilityKey
): number {
  return models.filter((model) => getModelCapabilityKeys(model).includes(key))
    .length
}

const TOKEN_FORMAT = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
})

export function formatModelTokenCount(tokens?: number): string {
  if (!Number.isFinite(tokens) || !tokens || tokens <= 0) return ''
  if (tokens >= 1_000_000) {
    return `${TOKEN_FORMAT.format(tokens / 1_000_000)}M`
  }
  if (tokens >= 1_000) {
    return `${TOKEN_FORMAT.format(tokens / 1_000)}K`
  }
  return TOKEN_FORMAT.format(tokens)
}
