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

import { PUBLIC_BRAND_NAME, TokenEraLogo } from '../token-era-logo'

describe('TokenEraLogo', () => {
  test('uses the display font token so brand type matches the theme', () => {
    render(<TokenEraLogo />)

    const mark = screen.getByRole('img', { name: PUBLIC_BRAND_NAME })
    const wordmark = mark.querySelector('text')

    expect(wordmark).toHaveAttribute('font-family', 'var(--font-display)')
  })
})
