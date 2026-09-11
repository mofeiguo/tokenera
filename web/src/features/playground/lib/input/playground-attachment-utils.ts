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
import { fileMatchesAccept, getFileExtension, resolveFileMimeType } from '@/lib/file-accept'
import { ATTACHMENT_ACTIONS } from './input-tool-utils'

export type PlaygroundInputModality =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'file'

const PLAYGROUND_INPUT_MODALITIES = new Set<PlaygroundInputModality>([
  'text',
  'image',
  'audio',
  'video',
  'file',
])

/** When catalog metadata is missing, playground still offers common attach types. */
export const PLAYGROUND_DEFAULT_INPUT_MODALITIES: PlaygroundInputModality[] = [
  'text',
  'image',
  'file',
]

const ATTACHMENT_ACTION_MODALITIES: Record<
  (typeof ATTACHMENT_ACTIONS)[number]['action'],
  readonly PlaygroundInputModality[]
> = {
  'upload-photo': ['image'],
  'upload-file': ['file', 'audio', 'video'],
}

export const PLAYGROUND_DOCUMENT_ACCEPT = [
  'text/*',
  'application/pdf',
  'application/json',
  'application/xml',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt',
  '.md',
  '.pdf',
  '.csv',
  '.json',
  '.html',
  '.xml',
  '.yaml',
  '.yml',
  '.py',
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.java',
  '.go',
  '.rs',
  '.c',
  '.cpp',
  '.h',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.zip',
].join(',')

function isPlaygroundInputModality(
  value: string
): value is PlaygroundInputModality {
  return PLAYGROUND_INPUT_MODALITIES.has(value as PlaygroundInputModality)
}

export function normalizeInputModalities(
  modalities: string[] | undefined
): PlaygroundInputModality[] {
  if (!modalities || modalities.length === 0) {
    return ['text']
  }

  const normalized: PlaygroundInputModality[] = []
  for (const modality of modalities) {
    if (!isPlaygroundInputModality(modality)) continue
    if (!normalized.includes(modality)) {
      normalized.push(modality)
    }
  }

  return normalized.length > 0 ? normalized : ['text']
}

export function getModelInputModalities(
  models: ModelOption[],
  modelValue: string
): PlaygroundInputModality[] {
  const selected = models.find((model) => model.value === modelValue)
  if (!selected?.inputModalities?.length) {
    return PLAYGROUND_DEFAULT_INPUT_MODALITIES
  }
  return normalizeInputModalities(selected.inputModalities)
}

export function modelSupportsAttachments(
  modalities: PlaygroundInputModality[]
): boolean {
  return modalities.some((modality) => modality !== 'text')
}

export function getPlaygroundAttachmentActions(
  modalities: PlaygroundInputModality[]
) {
  const modalitySet = new Set(modalities)
  return ATTACHMENT_ACTIONS.filter((action) =>
    ATTACHMENT_ACTION_MODALITIES[action.action].some((modality) =>
      modalitySet.has(modality)
    )
  )
}

export function getPlaygroundAttachmentAccept(
  modalities: PlaygroundInputModality[]
): string | undefined {
  const accepts: string[] = []
  if (modalities.includes('image')) accepts.push('image/*')
  if (modalities.includes('audio')) accepts.push('audio/*')
  if (modalities.includes('video')) accepts.push('video/*')
  if (modalities.includes('file')) accepts.push(PLAYGROUND_DOCUMENT_ACCEPT)
  return accepts.length > 0 ? accepts.join(',') : undefined
}

export function getPlaygroundAttachmentAcceptForAction(
  modalities: PlaygroundInputModality[],
  action: string
): string | undefined {
  if (action === 'upload-photo') {
    return modalities.includes('image') ? 'image/*' : undefined
  }

  if (action === 'upload-file') {
    const accepts: string[] = []
    if (modalities.includes('file')) accepts.push(PLAYGROUND_DOCUMENT_ACCEPT)
    if (modalities.includes('audio')) accepts.push('audio/*')
    if (modalities.includes('video')) accepts.push('video/*')
    return accepts.length > 0 ? accepts.join(',') : undefined
  }

  return getPlaygroundAttachmentAccept(modalities)
}

export function fileMatchesPlaygroundModalities(
  mediaType: string | undefined,
  modalities: PlaygroundInputModality[],
  filename?: string
): boolean {
  const effectiveType =
    mediaType?.trim() ||
    (filename
      ? resolveFileMimeType({ name: filename, type: '' })
      : '')
  if (!effectiveType && !filename) return false

  const modalitySet = new Set(modalities)
  if (effectiveType.startsWith('image/')) return modalitySet.has('image')
  if (effectiveType.startsWith('audio/')) return modalitySet.has('audio')
  if (effectiveType.startsWith('video/')) return modalitySet.has('video')

  if (modalitySet.has('file')) {
    if (!effectiveType) {
      const extension = filename ? getFileExtension(filename) : ''
      return extension !== '' && PLAYGROUND_DOCUMENT_ACCEPT.includes(extension)
    }
    return fileMatchesAccept(
      { name: filename ?? 'attachment', type: effectiveType },
      PLAYGROUND_DOCUMENT_ACCEPT
    )
  }

  return false
}
