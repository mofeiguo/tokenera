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
  formatModelSelectorListLabel,
  formatModelSelectorTriggerLabel,
  type ModelSelectorOption,
} from '../model-display-label'

describe('formatModelSelectorLabel', () => {
  const model: ModelSelectorOption = {
    label: 'Qwen-Image-2.0-Pro',
    value: 'qwen-image-2.0-pro',
    vendorName: 'Alibaba Cloud',
  }

  test('formats trigger label in ZenMux style', () => {
    expect(formatModelSelectorTriggerLabel(model, 'Model')).toBe(
      'Alibaba Cloud: Qwen-Image-2.0-Pro'
    )
  })

  test('formats list row label in ZenMux style', () => {
    expect(formatModelSelectorListLabel(model, 'Model')).toBe(
      'Alibaba Cloud: Qwen-Image-2.0-Pro'
    )
  })

  test('falls back when option is missing', () => {
    expect(formatModelSelectorTriggerLabel(undefined, 'Model')).toBe('Model')
  })
})
