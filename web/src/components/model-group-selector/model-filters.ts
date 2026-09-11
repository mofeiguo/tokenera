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
import type { ModelSelectorOption } from './model-display-label'

export type ModelCategoryTab = 'all' | 'text' | 'image'

export type ModelSortMode = 'catalog' | 'name'

export type PlaygroundModelOption = ModelSelectorOption & {
  category?: string
  description?: string
  outputModalities?: string[]
}

export function modelMatchesCategoryTab(
  model: PlaygroundModelOption,
  tab: ModelCategoryTab
): boolean {
  if (tab === 'all') {
    return true
  }

  const outputs = model.outputModalities ?? []
  const hasImageOutput = outputs.includes('image')

  if (tab === 'image') {
    return hasImageOutput
  }

  return !hasImageOutput
}

export function filterPlaygroundModels(
  models: PlaygroundModelOption[],
  options: {
    categoryTab: ModelCategoryTab
    searchQuery: string
    sortMode: ModelSortMode
  }
): PlaygroundModelOption[] {
  const query = options.searchQuery.trim().toLowerCase()
  let result = models.filter((model) => {
    if (!modelMatchesCategoryTab(model, options.categoryTab)) {
      return false
    }
    if (!query) {
      return true
    }

    const searchableText = [
      model.label,
      model.value,
      model.vendorName ?? '',
      model.description ?? '',
      model.category ?? '',
    ]
      .join(' ')
      .toLowerCase()

    return searchableText.includes(query)
  })

  if (options.sortMode === 'name') {
    result = [...result].sort((left, right) =>
      (left.label || left.value).localeCompare(
        right.label || right.value,
        undefined,
        { sensitivity: 'base' }
      )
    )
  }

  return result
}
