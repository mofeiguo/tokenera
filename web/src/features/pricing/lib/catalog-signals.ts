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
import type { ModelCapability, PricingModel } from '../types'

export const CATALOG_CAPABILITY_KEYS = [
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

export type CatalogCapabilityKey = (typeof CATALOG_CAPABILITY_KEYS)[number]

export const CATALOG_CAPABILITY_LABEL_KEYS: Record<
  CatalogCapabilityKey,
  string
> = {
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

const TOKEN_FORMAT = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
})

export function formatCatalogTokenCount(tokens?: number): string {
  if (!Number.isFinite(tokens) || !tokens || tokens <= 0) return ''
  if (tokens >= 1_000_000) {
    return `${TOKEN_FORMAT.format(tokens / 1_000_000)}M`
  }
  if (tokens >= 1_000) {
    return `${TOKEN_FORMAT.format(tokens / 1_000)}K`
  }
  return TOKEN_FORMAT.format(tokens)
}

function hasCapability(
  capabilities: readonly string[] | undefined,
  values: readonly ModelCapability[]
): boolean {
  if (!capabilities) return false
  return capabilities.some((capability) =>
    values.includes(capability as ModelCapability)
  )
}

function hasModality(
  modalities: readonly string[] | undefined,
  value: string
): boolean {
  return Boolean(modalities?.includes(value))
}

/**
 * Card/table capability chips come from catalog metadata:
 * modalities for vision/generation, capabilities for protocol features.
 * Streaming and system prompt are omitted because they apply to almost every chat model.
 */
export function getCatalogCapabilityKeys(
  model: Pick<
    PricingModel,
    'capabilities' | 'input_modalities' | 'output_modalities'
  >
): CatalogCapabilityKey[] {
  const keys: CatalogCapabilityKey[] = []

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
