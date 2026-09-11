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
import { useEffect } from 'react'

import { usePromptInputAttachments } from '@/components/ai-elements/prompt-input'

import {
  fileMatchesPlaygroundModalities,
  getModelInputModalities,
  type PlaygroundInputModality,
} from '../../lib'
import type { ModelOption } from '../../types'

type PlaygroundAttachmentSyncProps = {
  modelValue: string
  models: ModelOption[]
}

export function PlaygroundAttachmentSync({
  modelValue,
  models,
}: PlaygroundAttachmentSyncProps) {
  const attachments = usePromptInputAttachments()
  const modalities = getModelInputModalities(models, modelValue)

  useEffect(() => {
    for (const file of attachments.files) {
      if (
        !fileMatchesPlaygroundModalities(
          file.mediaType,
          modalities,
          file.filename
        )
      ) {
        attachments.remove(file.id)
      }
    }
    // Reconcile attachments only when the selected model modalities change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalities.join(','), modelValue])

  return null
}

export type { PlaygroundInputModality }
