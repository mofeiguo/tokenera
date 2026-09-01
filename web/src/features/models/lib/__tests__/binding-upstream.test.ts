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

import { resolveBindingUpstreamModel } from '../binding-upstream'

describe('resolveBindingUpstreamModel', () => {
  test('keeps the current channel model when it is still listed', () => {
    expect(
      resolveBindingUpstreamModel(
        ['deepseek-v4-pro', 'deepseek-chat'],
        'my-alias',
        'deepseek-chat'
      )
    ).toBe('deepseek-chat')
  })

  test('prefers the catalog name when it exists on the channel', () => {
    expect(
      resolveBindingUpstreamModel(
        ['my-alias', 'deepseek-v4-pro'],
        'my-alias'
      )
    ).toBe('my-alias')
  })

  test('falls back to the first channel model', () => {
    expect(
      resolveBindingUpstreamModel(['deepseek-v4-pro', 'deepseek-chat'], 'my-alias')
    ).toBe('deepseek-v4-pro')
  })
})
