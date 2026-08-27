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
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { getCookie, setCookie } from '@/lib/cookies'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = Exclude<Theme, 'system'>

const THEME_COOKIE = 'vite-ui-theme'
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const DARK_QUERY = '(prefers-color-scheme: dark)'

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function isTheme(value: string | undefined): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function getInitialTheme(): Theme {
  const saved = getCookie(THEME_COOKIE)
  return isTheme(saved) ? saved : 'system'
}

function getInitialResolvedTheme(): ResolvedTheme {
  if (document.documentElement.classList.contains('dark')) {
    return 'dark'
  }
  return 'light'
}

function applyResolvedTheme(theme: ResolvedTheme) {
  const root = document.documentElement
  const previousTheme = root.classList.contains('dark') ? 'dark' : 'light'

  if (
    previousTheme !== theme &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    root.classList.add('theme-transition')
    window.setTimeout(() => root.classList.remove('theme-transition'), 240)
  }

  root.classList.remove('light', 'dark')
  root.classList.add(theme)
  root.style.colorScheme = theme

  const themeColor = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]'
  )
  themeColor?.setAttribute('content', theme === 'dark' ? '#0b1020' : '#f7fafc')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(
    getInitialResolvedTheme
  )

  const setTheme = useCallback((nextTheme: Theme) => {
    setCookie(THEME_COOKIE, nextTheme, THEME_COOKIE_MAX_AGE)
    setThemeState(nextTheme)
  }, [])

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY)

    const updateTheme = () => {
      const nextResolved = theme === 'system' ? getSystemTheme() : theme
      applyResolvedTheme(nextResolved)
      setResolvedTheme(nextResolved)
    }

    updateTheme()
    if (theme !== 'system') {
      return
    }

    media.addEventListener('change', updateTheme)
    return () => media.removeEventListener('change', updateTheme)
  }, [theme])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [resolvedTheme, setTheme, theme]
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
