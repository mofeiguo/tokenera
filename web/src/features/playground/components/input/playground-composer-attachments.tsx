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
import { PaperclipIcon, XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { usePromptInputAttachments } from '@/components/ai-elements/prompt-input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import {
  PLAYGROUND_INPUT_ATTACHMENT_FILE,
  PLAYGROUND_INPUT_ATTACHMENT_IMAGE,
  PLAYGROUND_INPUT_ATTACHMENT_REMOVE,
  PLAYGROUND_INPUT_ATTACHMENT_STRIP,
} from '../../lib'

function isImageAttachment(mediaType: string | undefined) {
  return mediaType?.startsWith('image/') ?? false
}

export function PlaygroundComposerAttachments() {
  const { t } = useTranslation()
  const attachments = usePromptInputAttachments()

  if (attachments.files.length === 0) {
    return null
  }

  return (
    <div
      aria-label={t('Attachments')}
      className={PLAYGROUND_INPUT_ATTACHMENT_STRIP}
      role='list'
    >
      {attachments.files.map((attachment) => {
        const filename = attachment.filename || ''
        const isImage =
          isImageAttachment(attachment.mediaType) && Boolean(attachment.url)

        return (
          <div
            className='relative shrink-0'
            key={attachment.id}
            role='listitem'
          >
            {isImage ? (
              <div className={PLAYGROUND_INPUT_ATTACHMENT_IMAGE}>
                <img
                  alt={filename || t('Image')}
                  className='size-full object-cover'
                  height={56}
                  src={attachment.url}
                  width={56}
                />
              </div>
            ) : (
              <div className={PLAYGROUND_INPUT_ATTACHMENT_FILE}>
                <PaperclipIcon className='text-muted-foreground size-3.5 shrink-0' />
                <span className='max-w-[8rem] truncate'>
                  {filename || t('Attachment')}
                </span>
              </div>
            )}
            <Button
              aria-label={t('Remove attachment')}
              className={cn(PLAYGROUND_INPUT_ATTACHMENT_REMOVE)}
              onClick={() => attachments.remove(attachment.id)}
              size='icon'
              type='button'
              variant='secondary'
            >
              <XIcon className='size-3' />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
