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
import type { ModelOption } from '../../types'

export function getModelCapabilities(
  models: ModelOption[],
  modelValue: string
): string[] {
  const selected = models.find((model) => model.value === modelValue)
  return selected?.capabilities ?? []
}

export function modelSupportsWebSearch(
  models: ModelOption[],
  modelValue: string
): boolean {
  return getModelCapabilities(models, modelValue).includes('web_search')
}

export type PlaygroundModelSpec = {
  labelKey: string
  values: string[]
}

export type PlaygroundModelCard = {
  icon?: string
  label: string
  specs: PlaygroundModelSpec[]
  value: string
  vendorName?: string
}

const CAPABILITY_LABEL_KEYS: Record<string, string> = {
  tools: 'Tools',
  web_search: 'Web search',
}

const MODALITY_LABEL_KEYS: Record<string, string> = {
  audio: 'Audio',
  file: 'File',
  image: 'Image',
  text: 'Text',
  video: 'Video',
}

export function getPlaygroundSpecValueLabel(value: string): string {
  return (
    CAPABILITY_LABEL_KEYS[value] ??
    MODALITY_LABEL_KEYS[value] ??
    value.replaceAll('_', ' ')
  )
}

export function getPlaygroundModelCard(
  models: ModelOption[],
  modelValue: string
): PlaygroundModelCard | null {
  const model = models.find((item) => item.value === modelValue)
  if (!model) return null

  const specs = (
    [
      { labelKey: 'Input', values: model.inputModalities ?? [] },
      { labelKey: 'Output', values: model.outputModalities ?? [] },
      { labelKey: 'Capabilities', values: model.capabilities ?? [] },
      { labelKey: 'Protocols', values: model.supportedEndpointTypes ?? [] },
    ] satisfies PlaygroundModelSpec[]
  ).filter((spec) => spec.values.length > 0)

  return {
    icon: model.icon,
    label: model.label,
    specs,
    value: model.value,
    vendorName: model.vendorName,
  }
}
