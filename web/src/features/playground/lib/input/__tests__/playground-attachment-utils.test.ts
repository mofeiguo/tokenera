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
  fileMatchesPlaygroundModalities,
  getModelInputModalities,
  getPlaygroundAttachmentAccept,
  getPlaygroundAttachmentAcceptForAction,
  getPlaygroundAttachmentActions,
  modelSupportsAttachments,
} from '../playground-attachment-utils'

describe('playground attachment utils', () => {
  test('filters attachment actions by the selected model modalities', () => {
    expect(
      getPlaygroundAttachmentActions(['text', 'image']).map(
        (action) => action.action
      )
    ).toEqual(['upload-photo'])
    expect(
      getPlaygroundAttachmentActions(['text', 'image', 'file']).map(
        (action) => action.action
      )
    ).toEqual(['upload-photo', 'upload-file'])
    expect(getPlaygroundAttachmentActions(['text'])).toEqual([])
  })

  test('includes file upload when file, audio, or video input is supported', () => {
    expect(
      getPlaygroundAttachmentActions(['text', 'file']).map(
        (action) => action.action
      )
    ).toEqual(['upload-file'])
    expect(
      getPlaygroundAttachmentActions(['text', 'audio']).map(
        (action) => action.action
      )
    ).toEqual(['upload-file'])
  })

  test('builds accept filters from supported modalities', () => {
    expect(getPlaygroundAttachmentAccept(['text', 'image', 'audio'])).toBe(
      'image/*,audio/*'
    )
    expect(getPlaygroundAttachmentAcceptForAction(['text', 'file'], 'upload-file')).toContain(
      '.pdf'
    )
    expect(
      getPlaygroundAttachmentAcceptForAction(['text', 'image'], 'upload-photo')
    ).toBe('image/*')
    expect(modelSupportsAttachments(['text'])).toBe(false)
    expect(modelSupportsAttachments(['text', 'image'])).toBe(true)
  })

  test('reads modalities from the selected model option', () => {
    expect(
      getModelInputModalities(
        [
          {
            label: 'gpt-4o',
            value: 'gpt-4o',
            inputModalities: ['text', 'image'],
          },
        ],
        'gpt-4o'
      )
    ).toEqual(['text', 'image'])
  })

  test('defaults to image and file upload when catalog modalities are missing', () => {
    expect(getModelInputModalities([], 'gpt-4o')).toEqual([
      'text',
      'image',
      'file',
    ])
    expect(
      getModelInputModalities(
        [{ label: 'gpt-4o', value: 'gpt-4o', inputModalities: [] }],
        'gpt-4o'
      )
    ).toEqual(['text', 'image', 'file'])
  })

  test('matches attachment media types against supported modalities', () => {
    expect(
      fileMatchesPlaygroundModalities('image/png', ['text', 'image'])
    ).toBe(true)
    expect(
      fileMatchesPlaygroundModalities('application/pdf', ['text', 'image'])
    ).toBe(false)
    expect(
      fileMatchesPlaygroundModalities('application/pdf', ['text', 'file'])
    ).toBe(true)
    expect(
      fileMatchesPlaygroundModalities(undefined, ['text', 'file'], 'notes.txt')
    ).toBe(true)
  })
})
