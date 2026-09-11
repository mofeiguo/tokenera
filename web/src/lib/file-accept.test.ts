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

import { fileMatchesAccept, resolveFileMimeType } from './file-accept'

describe('fileMatchesAccept', () => {
  test('accepts images and documents when both patterns are listed', () => {
    const accept = 'image/*,text/*,.pdf'

    expect(
      fileMatchesAccept({ name: 'photo.png', type: 'image/png' }, accept)
    ).toBe(true)
    expect(
      fileMatchesAccept({ name: 'notes.txt', type: '' }, accept)
    ).toBe(true)
    expect(
      fileMatchesAccept({ name: 'report.pdf', type: 'application/pdf' }, accept)
    ).toBe(true)
    expect(
      fileMatchesAccept({ name: 'archive.zip', type: 'application/zip' }, accept)
    ).toBe(false)
  })

  test('infers mime types from common document extensions', () => {
    expect(resolveFileMimeType({ name: 'readme.md', type: '' })).toBe(
      'text/markdown'
    )
    expect(resolveFileMimeType({ name: 'data.csv', type: '' })).toBe(
      'text/csv'
    )
  })
})
