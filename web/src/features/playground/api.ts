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
import { api } from '@/lib/api'

import { API_ENDPOINTS } from './constants'
import type { ModelOption } from './types'

export type PlaygroundRequestPayload = Record<string, unknown>

/**
 * Send playground request (non-streaming)
 */
export async function sendChatCompletion(
  url: string,
  payload: PlaygroundRequestPayload,
  signal?: AbortSignal
): Promise<unknown> {
  const res = await api.post(url, payload, {
    signal,
    skipErrorHandler: true,
  } as Record<string, unknown>)
  return res.data
}

/**
 * Get user available models
 */
export async function getUserModels(): Promise<ModelOption[]> {
  const res = await api.get(API_ENDPOINTS.USER_MODELS)
  const { data } = res

  if (!data.success || !Array.isArray(data.data)) {
    return []
  }

  const endpointMap =
    (data.supported_endpoint_types as Record<string, string[]> | undefined) ??
    {}
  const modalityMap =
    (data.input_modalities as Record<string, string[]> | undefined) ?? {}
  const capabilityMap =
    (data.capabilities as Record<string, string[]> | undefined) ?? {}
  const iconMap = (data.model_icons as Record<string, string> | undefined) ?? {}
  const vendorMap =
    (data.vendor_names as Record<string, string> | undefined) ?? {}

  const outputModalityMap =
    (data.output_modalities as Record<string, string[]> | undefined) ?? {}

  return data.data.map((model: string) => ({
    label: model,
    value: model,
    supportedEndpointTypes: endpointMap[model] ?? [],
    inputModalities: modalityMap[model] ?? [],
    outputModalities: outputModalityMap[model] ?? [],
    capabilities: capabilityMap[model] ?? [],
    icon: iconMap[model],
    vendorName: vendorMap[model],
  }))
}
