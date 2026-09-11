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

import {
  getInputControlState,
  getPlaygroundSubmitPayload,
} from '../input-control-utils'

const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const models = [{ label: 'gpt-4o', value: 'gpt-4o' }]

describe('getPlaygroundSubmitPayload', () => {
  test('accepts image-only submissions as base64 attachments', () => {
    expect(
      getPlaygroundSubmitPayload({
        text: '   ',
        files: [
          {
            url: TINY_PNG_DATA_URL,
            mediaType: 'image/png',
            filename: 'dot.png',
          },
        ],
      })
    ).toEqual({
      text: '   ',
      images: [
        {
          url: TINY_PNG_DATA_URL,
          mediaType: 'image/png',
          filename: 'dot.png',
        },
      ],
    })
  })

  test('rejects empty text without images', () => {
    expect(getPlaygroundSubmitPayload({ text: '  ' })).toBeNull()
  })

  test('accepts file-only submissions when attachments are present', () => {
    expect(
      getPlaygroundSubmitPayload({
        text: '',
        files: [
          {
            url: 'blob:notes',
            mediaType: 'application/pdf',
            filename: 'notes.pdf',
          },
        ],
      })
    ).toEqual({
      text: '',
      images: [],
    })
  })
})

describe('getInputControlState', () => {
  test('allows sending when attachments are present even without text', () => {
    expect(
      getInputControlState({
        hasStopHandler: false,
        hasAttachments: true,
        models,
        text: '',
      }).canSubmit
    ).toBe(true)
  })

  test('blocks sending when there is no text and no attachments', () => {
    expect(
      getInputControlState({
        hasStopHandler: false,
        hasAttachments: false,
        models,
        text: '',
      }).canSubmit
    ).toBe(false)
  })
})
