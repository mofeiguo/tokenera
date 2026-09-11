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

import type { AuthUser } from '@/stores/auth-store'

import {
  buildSignInRedirectParam,
  getSavedLanguage,
  sanitizeAuthRedirect,
  signInPathWithRedirect,
} from './auth-redirect'

const origin = 'https://dashboard.example.com'

describe('authentication redirect validation', () => {
  test('preserves safe internal paths, search parameters, and fragments', () => {
    expect(sanitizeAuthRedirect('/console?tab=usage#recent', origin)).toBe(
      '/console?tab=usage#recent'
    )
    expect(
      sanitizeAuthRedirect(
        'https://dashboard.example.com/dashboard?tab=quota#daily',
        origin
      )
    ).toBe('/dashboard?tab=quota#daily')
  })

  test('rejects external and ambiguously parsed redirect targets', () => {
    const unsafeTargets: unknown[] = [
      undefined,
      '',
      'dashboard',
      '//attacker.example/path',
      'https://attacker.example/path',
      'javascript:alert(1)',
      '/\\attacker.example/path',
      'https:\\attacker.example/path',
    ]

    for (const target of unsafeTargets) {
      expect(sanitizeAuthRedirect(target, origin)).toBe(null)
    }
  })

  test('rejects auth guest routes so login does not loop back to sign-in', () => {
    const guestTargets = [
      '/sign-in',
      '/sign-in?redirect=%2Fdashboard',
      'https://dashboard.example.com/sign-in',
      '/sign-up',
      '/otp',
      '/forgot-password',
      '/oauth/github',
    ]

    for (const target of guestTargets) {
      expect(sanitizeAuthRedirect(target, origin)).toBe(null)
    }
  })

  test('buildSignInRedirectParam omits unsafe targets', () => {
    expect(
      buildSignInRedirectParam('https://dashboard.example.com/sign-in', origin)
    ).toBe(null)
    expect(
      buildSignInRedirectParam('https://dashboard.example.com/dashboard', origin)
    ).toBe('https://dashboard.example.com/dashboard')
  })

  test('signInPathWithRedirect drops guest redirect loops', () => {
    const localOrigin = 'http://localhost:3007'
    expect(
      signInPathWithRedirect(`${localOrigin}/sign-in`, localOrigin)
    ).toBe('/sign-in')
    expect(
      signInPathWithRedirect(`${localOrigin}/dashboard`, localOrigin)
    ).toBe('/sign-in?redirect=http%3A%2F%2Flocalhost%3A3007%2Fdashboard')
  })

  test('rejects invalid or non-HTTP application origins', () => {
    expect(sanitizeAuthRedirect('/dashboard', 'not-an-origin')).toBe(null)
    expect(sanitizeAuthRedirect('/dashboard', 'file:///tmp/app')).toBe(null)
  })
})

describe('saved authentication language', () => {
  const user: AuthUser = { id: 1, username: 'user', role: 1 }

  test('prefers the explicit user language', () => {
    expect(
      getSavedLanguage({
        ...user,
        language: 'ja',
        setting: { language: 'fr' },
      })
    ).toBe('ja')
  })

  test('reads object and JSON string settings', () => {
    expect(getSavedLanguage({ ...user, setting: { language: 'fr' } })).toBe(
      'fr'
    )
    expect(getSavedLanguage({ ...user, setting: '{"language":"ru"}' })).toBe(
      'ru'
    )
  })

  test('ignores malformed and non-string setting languages', () => {
    expect(getSavedLanguage({ ...user, setting: '{' })).toBe(undefined)
    expect(getSavedLanguage({ ...user, setting: { language: 123 } })).toBe(
      undefined
    )
  })
})
