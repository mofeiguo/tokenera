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
  filterPlaygroundModels,
  modelMatchesCategoryTab,
  type PlaygroundModelOption,
} from '../model-filters'

const models: PlaygroundModelOption[] = [
  {
    label: 'gpt-4o',
    value: 'gpt-4o',
    outputModalities: ['text'],
    vendorName: 'OpenAI',
  },
  {
    label: 'dall-e-3',
    value: 'dall-e-3',
    outputModalities: ['image'],
    vendorName: 'OpenAI',
  },
]

describe('modelMatchesCategoryTab', () => {
  test('filters image models on the image tab', () => {
    expect(modelMatchesCategoryTab(models[1], 'image')).toBe(true)
    expect(modelMatchesCategoryTab(models[0], 'image')).toBe(false)
  })

  test('filters text models on the text tab', () => {
    expect(modelMatchesCategoryTab(models[0], 'text')).toBe(true)
    expect(modelMatchesCategoryTab(models[1], 'text')).toBe(false)
  })
})

describe('filterPlaygroundModels', () => {
  test('searches by vendor and model name', () => {
    expect(
      filterPlaygroundModels(models, {
        categoryTab: 'all',
        searchQuery: 'dall',
        sortMode: 'catalog',
      }).map((model) => model.value)
    ).toEqual(['dall-e-3'])
  })

  test('sorts alphabetically by name', () => {
    expect(
      filterPlaygroundModels(models, {
        categoryTab: 'all',
        searchQuery: '',
        sortMode: 'name',
      }).map((model) => model.value)
    ).toEqual(['dall-e-3', 'gpt-4o'])
  })
})
