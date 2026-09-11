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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  PromptInput,
  PromptInputFooter,
  PromptInputTextarea,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input'

import {
  PLAYGROUND_MAX_IMAGE_BYTES,
  PLAYGROUND_MAX_IMAGES,
} from '../../constants'
import {
  getModelInputModalities,
  getPlaygroundAttachmentAccept,
  getPlaygroundSubmitPayload,
  PLAYGROUND_INPUT_ACTIONS,
  PLAYGROUND_INPUT_SURFACE,
  PLAYGROUND_INPUT_TEXTAREA,
  PLAYGROUND_INPUT_TEXTAREA_WRAP,
  modelSupportsAttachments,
} from '../../lib'
import type {
  ModelOption,
  PlaygroundImageAttachment,
} from '../../types'
import { PlaygroundAttachmentSync } from './playground-attachment-sync'
import { PlaygroundComposerActions } from './playground-composer-actions'
import { PlaygroundComposerAttachments } from './playground-composer-attachments'

interface PlaygroundInputProps {
  disabled?: boolean
  isGenerating?: boolean
  isModelLoading?: boolean
  models: ModelOption[]
  modelValue: string
  onStop?: () => void
  onSubmit: (text: string, images?: PlaygroundImageAttachment[]) => void
}

export function PlaygroundInput({
  disabled,
  isGenerating,
  isModelLoading = false,
  models,
  modelValue,
  onStop,
  onSubmit,
}: PlaygroundInputProps) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const inputModalities = getModelInputModalities(models, modelValue)
  const attachmentsEnabled = modelSupportsAttachments(inputModalities)
  const attachmentAccept = getPlaygroundAttachmentAccept(inputModalities)

  const handleSubmit = (message: PromptInputMessage) => {
    const payload = getPlaygroundSubmitPayload(message, disabled)

    if (!payload) return
    onSubmit(payload.text, payload.images)
    setText('')
  }

  return (
    <PromptInput
      accept={attachmentAccept}
      attachmentsEnabled={attachmentsEnabled}
      className='relative w-full'
      groupClassName={PLAYGROUND_INPUT_SURFACE}
      maxFileSize={PLAYGROUND_MAX_IMAGE_BYTES}
      maxFiles={PLAYGROUND_MAX_IMAGES}
      multiple
      onError={(error) => toast.error(error.message)}
      onSubmit={handleSubmit}
    >
      <PlaygroundAttachmentSync modelValue={modelValue} models={models} />
      <PlaygroundComposerAttachments />
      <div className={PLAYGROUND_INPUT_TEXTAREA_WRAP}>
        <PromptInputTextarea
          autoComplete='off'
          autoCorrect='off'
          autoCapitalize='off'
          spellCheck={false}
          className={PLAYGROUND_INPUT_TEXTAREA}
          disabled={disabled}
          onChange={(event) => setText(event.target.value)}
          placeholder={t('Start a new conversation...')}
          rows={1}
          value={text}
        />
      </div>

      <PromptInputFooter className={PLAYGROUND_INPUT_ACTIONS}>
        <PlaygroundComposerActions
          disabled={disabled}
          inputModalities={inputModalities}
          isGenerating={isGenerating}
          isModelLoading={isModelLoading}
          modelValue={modelValue}
          models={models}
          onStop={onStop}
          text={text}
        />
      </PromptInputFooter>
    </PromptInput>
  )
}
