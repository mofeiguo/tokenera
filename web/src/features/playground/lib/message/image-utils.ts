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
import type { Message, PlaygroundImageAttachment } from '../../types'

const IMAGE_DATA_URL_PATTERN =
  /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})$/

export type ParsedImageDataUrl = {
  data: string
  mediaType: string
}

type ImageFilePart = {
  filename?: string
  mediaType?: string
  url?: string
}

export function parseImageDataUrl(url: string): ParsedImageDataUrl | null {
  const match = IMAGE_DATA_URL_PATTERN.exec(url.trim())
  if (!match) {
    return null
  }

  return {
    mediaType: match[1],
    data: match[2],
  }
}

export function extractPlaygroundImages(
  files: ImageFilePart[]
): PlaygroundImageAttachment[] {
  const images: PlaygroundImageAttachment[] = []

  for (const file of files) {
    if (!file.url || !file.mediaType?.startsWith('image/')) {
      continue
    }
    if (!parseImageDataUrl(file.url)) {
      continue
    }

    images.push({
      url: file.url,
      mediaType: file.mediaType,
      filename: file.filename,
    })
  }

  return images
}

export function hasMessageImages(message: Message): boolean {
  return (message.images?.length ?? 0) > 0
}
