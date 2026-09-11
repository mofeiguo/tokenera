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
import { describe, expect, test } from 'vitest'

import type { Message } from '../../../types'
import {
  extractPlaygroundImages,
  hasMessageImages,
  parseImageDataUrl,
} from '../image-utils'
import { buildMessageContent, formatMessageForAPI } from '../message-utils'

const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

describe('parseImageDataUrl', () => {
  test('extracts mime type and base64 payload from a data URL', () => {
    expect(parseImageDataUrl(TINY_PNG_DATA_URL)).toEqual({
      mediaType: 'image/png',
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    })
  })

  test('rejects remote URLs and non-image data URLs', () => {
    expect(parseImageDataUrl('https://example.test/a.png')).toBeNull()
    expect(parseImageDataUrl('data:text/plain;base64,aGVsbG8=')).toBeNull()
  })
})

describe('extractPlaygroundImages', () => {
  test('keeps image data URLs and drops other files', () => {
    expect(
      extractPlaygroundImages([
        {
          url: TINY_PNG_DATA_URL,
          mediaType: 'image/png',
          filename: 'dot.png',
        },
        {
          url: 'blob:https://example.test/1',
          mediaType: 'image/png',
          filename: 'preview.png',
        },
        {
          url: TINY_PNG_DATA_URL,
          mediaType: 'application/pdf',
          filename: 'doc.pdf',
        },
      ])
    ).toEqual([
      {
        url: TINY_PNG_DATA_URL,
        mediaType: 'image/png',
        filename: 'dot.png',
      },
    ])
  })
})

describe('formatMessageForAPI', () => {
  test('sends OpenAI image_url parts from attached base64 images', () => {
    const message: Message = {
      key: 'u1',
      from: 'user',
      versions: [{ id: 'v1', content: 'what is this?' }],
      images: [
        {
          url: TINY_PNG_DATA_URL,
          mediaType: 'image/png',
          filename: 'dot.png',
        },
      ],
    }

    expect(formatMessageForAPI(message)).toEqual({
      role: 'user',
      content: [
        { type: 'text', text: 'what is this?' },
        { type: 'image_url', image_url: { url: TINY_PNG_DATA_URL } },
      ],
    })
    expect(hasMessageImages(message)).toBe(true)
  })

  test('omits empty text parts when only images are attached', () => {
    expect(buildMessageContent('', [TINY_PNG_DATA_URL])).toEqual([
      { type: 'image_url', image_url: { url: TINY_PNG_DATA_URL } },
    ])
  })
})
