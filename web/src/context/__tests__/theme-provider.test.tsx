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
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { ThemeProvider, useTheme } from '../theme-provider'

function ThemeProbe() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  return (
    <>
      <output>{`${theme}:${resolvedTheme}`}</output>
      <button type='button' onClick={() => setTheme('dark')}>
        dark
      </button>
    </>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    document.cookie = 'vite-ui-theme=; path=/; max-age=0'
    document.documentElement.classList.remove('light', 'dark')
    document.head.innerHTML = '<meta name="theme-color" content="#f7fafc" />'
  })

  it('defaults to the system preference', async () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('system:light')).toBeInTheDocument()
      expect(document.documentElement).toHaveClass('light')
    })
  })

  it('persists an explicit dark preference and updates document chrome', async () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'dark' }))

    await waitFor(() => {
      expect(screen.getByText('dark:dark')).toBeInTheDocument()
      expect(document.documentElement).toHaveClass('dark')
      expect(document.cookie).toContain('vite-ui-theme=dark')
      expect(
        document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
          ?.content
      ).toBe('#0b1020')
    })
  })
})
