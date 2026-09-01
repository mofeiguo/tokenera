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
import type { TFunction } from 'i18next'

import type { ModelOption, PlaygroundEndpointType } from '../../types'

export const PLAYGROUND_ENDPOINT_TYPES = [
  'openai',
  'openai-response',
  'anthropic',
  'gemini',
] as const satisfies readonly PlaygroundEndpointType[]

export function isPlaygroundEndpointType(
  value: string
): value is PlaygroundEndpointType {
  return (PLAYGROUND_ENDPOINT_TYPES as readonly string[]).includes(value)
}

export function getPlaygroundEndpointTypes(
  advertised: string[] | undefined
): PlaygroundEndpointType[] {
  if (!advertised || advertised.length === 0) {
    return [...PLAYGROUND_ENDPOINT_TYPES]
  }

  const available: PlaygroundEndpointType[] = []
  for (const item of advertised) {
    if (!isPlaygroundEndpointType(item) || available.includes(item)) {
      continue
    }
    available.push(item)
  }
  return available
}

export function resolvePlaygroundEndpointType(
  advertised: string[] | undefined,
  current: string
): PlaygroundEndpointType {
  const available = getPlaygroundEndpointTypes(advertised)
  if (available.length === 0) {
    return 'openai'
  }
  if (isPlaygroundEndpointType(current) && available.includes(current)) {
    return current
  }
  return available[0]
}

export function getPlaygroundEndpointLabel(
  t: TFunction,
  endpointType: PlaygroundEndpointType
): string {
  switch (endpointType) {
    case 'openai-response':
      return t('Response')
    case 'anthropic':
      return t('Anthropic')
    case 'gemini':
      return t('Gemini')
    default:
      return t('Chat')
  }
}

export function getModelEndpointTypes(
  models: ModelOption[],
  modelValue: string
): PlaygroundEndpointType[] {
  if (models.length === 0) {
    return []
  }
  const selected = models.find((model) => model.value === modelValue)
  return getPlaygroundEndpointTypes(selected?.supportedEndpointTypes)
}
