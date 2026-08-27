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
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ensureCatalogModels } from '../../api'
import { ensureCatalogModelsForBinding } from '../ensure-catalog'

vi.mock('../../api', () => ({
  ensureCatalogModels: vi.fn(),
}))

describe('ensureCatalogModelsForBinding', () => {
  beforeEach(() => {
    vi.mocked(ensureCatalogModels).mockReset()
  })

  test('skips the API when every name is blank', async () => {
    await expect(ensureCatalogModelsForBinding(['', '  '])).resolves.toEqual([])
    expect(ensureCatalogModels).not.toHaveBeenCalled()
  })

  test('deduplicates names and returns newly created catalog models', async () => {
    vi.mocked(ensureCatalogModels).mockResolvedValue({
      success: true,
      data: { created: ['gpt-4o'], created_count: 1 },
    })

    await expect(
      ensureCatalogModelsForBinding([' gpt-4o ', 'gpt-4o', 'claude-3'])
    ).resolves.toEqual(['gpt-4o'])
    expect(ensureCatalogModels).toHaveBeenCalledWith(['gpt-4o', 'claude-3'])
  })
})
