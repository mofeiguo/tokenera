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
import { z } from 'zod'

// ============================================================================
// Model Types
// ============================================================================

/**
 * Bound channel information
 */
export interface BoundChannel {
  id: number
  name: string
  type: number
  enabled: boolean
}

export interface ModelChannelBinding {
  id?: number
  model_id?: number
  model_name?: string
  channel_id: number
  channel_name?: string
  channel_type?: number
  channel_status?: number
  enabled: boolean
  priority?: number
  weight?: number
  upstream_model?: string
}

/**
 * Model entity from API
 */
export interface Model {
  id: number
  model_name: string
  description?: string
  icon?: string
  tags?: string
  input_modalities?: ModelModality[]
  output_modalities?: ModelModality[]
  capabilities?: ModelCapability[]
  context_length?: number
  max_output_tokens?: number
  vendor_id?: number
  endpoints?: string
  status: number
  created_time: number
  updated_time: number
  name_rule: number
  // Runtime fields
  bound_channels?: BoundChannel[]
  quota_types?: number[]
  matched_models?: string[]
  matched_count?: number
}

export type ModelModality = 'text' | 'image' | 'audio' | 'video' | 'file'

export type ModelCapability =
  | 'function_calling'
  | 'streaming'
  | 'json_mode'
  | 'structured_output'
  | 'reasoning'
  | 'tools'
  | 'system_prompt'
  | 'web_search'
  | 'code_interpreter'
  | 'caching'
  | 'embeddings'

/**
 * Vendor entity from API
 */
export interface Vendor {
  id: number
  name: string
  description?: string
  icon?: string
  status: number
  created_time: number
  updated_time: number
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Get models list parameters
 */
export interface GetModelsParams {
  p?: number
  page_size?: number
  vendor?: string // vendor ID to filter by
  status?: string // filter by status
}

/**
 * Search models parameters
 */
export interface SearchModelsParams {
  keyword?: string
  vendor?: string // vendor ID to filter by
  status?: string // filter by status
  p?: number
  page_size?: number
}

/**
 * Get models response
 */
export interface GetModelsResponse {
  success: boolean
  message?: string
  data?: {
    items: Model[]
    total: number
    page: number
    page_size: number
    vendor_counts?: Record<string, number>
  }
}

/**
 * Get model detail response
 */
export interface GetModelResponse {
  success: boolean
  message?: string
  data?: Model
}

/**
 * Get vendors response
 */
export interface GetVendorsResponse {
  success: boolean
  message?: string
  data?: {
    items: Vendor[]
    total: number
    page: number
    page_size: number
  }
}

/**
 * Get vendor response
 */
export interface GetVendorResponse {
  success: boolean
  message?: string
  data?: Vendor
}

// ============================================================================
// Form Data Types
// ============================================================================

/**
 * Model form schema
 */
export const modelFormSchema = z.object({
  id: z.number().optional(),
  model_name: z.string().min(1, 'Model name is required'),
  description: z.string().default(''),
  tags: z.array(z.string()).default([]),
  input_modalities: z
    .array(z.enum(['text', 'image', 'audio', 'video', 'file']))
    .default([]),
  output_modalities: z
    .array(z.enum(['text', 'image', 'audio', 'video', 'file']))
    .default([]),
  capabilities: z
    .array(
      z.enum([
        'function_calling',
        'streaming',
        'json_mode',
        'structured_output',
        'reasoning',
        'tools',
        'system_prompt',
        'web_search',
        'code_interpreter',
        'caching',
        'embeddings',
      ])
    )
    .default([]),
  context_length: z.number().int().min(0).default(0),
  max_output_tokens: z.number().int().min(0).default(0),
  vendor_id: z.number().optional(),
  endpoints: z.string().default(''),
  name_rule: z.number().min(0).max(3).default(0),
  status: z.boolean().default(true),
})

export type ModelFormValues = z.infer<typeof modelFormSchema>

/**
 * Vendor form schema
 */
export const vendorFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Vendor name is required'),
  description: z.string().default(''),
  icon: z.string().default(''),
  status: z.number().default(1),
})

export type VendorFormValues = z.infer<typeof vendorFormSchema>

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Name rule type
 */
export type NameRule = 0 | 1 | 2 | 3 // exact, prefix, contains, suffix

/**
 * Model status type
 */
export type ModelStatus = 0 | 1 // disabled, enabled

/**
 * Quota type
 */
export type QuotaType = 0 | 1 // usage-based, per-call
