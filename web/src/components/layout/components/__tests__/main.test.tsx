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
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { Main } from '../main'

describe('Main landmark', () => {
  test('provides the skip-link target and can receive programmatic focus', () => {
    render(<Main>Content</Main>)

    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'content')
    expect(main).toHaveAttribute('tabindex', '-1')
  })

  test('preserves an explicit landmark id', () => {
    render(<Main id='custom-content'>Content</Main>)

    expect(screen.getByRole('main')).toHaveAttribute('id', 'custom-content')
  })
})
