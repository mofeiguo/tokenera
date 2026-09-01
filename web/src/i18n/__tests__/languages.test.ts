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
  convertDetectedLanguage,
  INTERFACE_LANGUAGE_OPTIONS,
  normalizeInterfaceLanguage,
  toIntlLocale,
} from '../languages'

describe('interface languages', () => {
  test('exposes only Simplified Chinese and English', () => {
    expect(INTERFACE_LANGUAGE_OPTIONS.map((language) => language.code)).toEqual(
      ['zhCN', 'en']
    )
  })

  test('normalizes Chinese variants to zhCN', () => {
    expect(normalizeInterfaceLanguage('zh')).toBe('zhCN')
    expect(normalizeInterfaceLanguage('zh-CN')).toBe('zhCN')
    expect(normalizeInterfaceLanguage('zhCN')).toBe('zhCN')
    expect(normalizeInterfaceLanguage('zh-TW')).toBe('zhCN')
    expect(normalizeInterfaceLanguage('zhTW')).toBe('zhCN')
    expect(normalizeInterfaceLanguage('zh-Hant')).toBe('zhCN')
  })

  test('maps unsupported languages to English', () => {
    expect(normalizeInterfaceLanguage('fr')).toBe('en')
    expect(normalizeInterfaceLanguage('ja')).toBe('en')
    expect(normalizeInterfaceLanguage('ru')).toBe('en')
    expect(normalizeInterfaceLanguage('vi')).toBe('en')
    expect(normalizeInterfaceLanguage(undefined)).toBe('en')
  })

  test('converts detected browser locales', () => {
    expect(convertDetectedLanguage('zh-CN')).toBe('zhCN')
    expect(convertDetectedLanguage('zh-TW')).toBe('zhCN')
    expect(convertDetectedLanguage('fr-FR')).toBe('fr-FR')
  })

  test('converts interface codes to Intl locale tags', () => {
    expect(toIntlLocale('zhCN')).toBe('zh-CN')
    expect(toIntlLocale('en')).toBe('en')
  })
})
