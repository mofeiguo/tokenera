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
import { useTranslation } from 'react-i18next'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import type { PlaygroundImageAttachment } from '../../types'

type PlaygroundMessageImagesProps = {
  images: PlaygroundImageAttachment[]
}

export function PlaygroundMessageImages({
  images,
}: PlaygroundMessageImagesProps) {
  if (images.length === 0) {
    return null
  }

  return (
    <div className='mb-2 flex flex-wrap gap-2'>
      {images.map((image) => (
        <PlaygroundMessageImage image={image} key={image.url} />
      ))}
    </div>
  )
}

function PlaygroundMessageImage({
  image,
}: {
  image: PlaygroundImageAttachment
}) {
  const { t } = useTranslation()
  const alt = image.filename || t('Attached image')

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            className='border-border bg-muted/30 overflow-hidden rounded-lg border'
            type='button'
          >
            <img
              alt={alt}
              className='max-h-48 max-w-56 object-contain'
              src={image.url}
            />
          </button>
        }
      />
      <DialogContent className='max-w-4xl p-3 sm:max-w-4xl'>
        <DialogHeader>
          <DialogTitle>{alt}</DialogTitle>
        </DialogHeader>
        <img
          alt={alt}
          className='max-h-[80vh] w-full object-contain'
          src={image.url}
        />
      </DialogContent>
    </Dialog>
  )
}
