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
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const setOpen = vi.fn()

vi.mock('@/context/search-provider', () => ({
  useSearch: () => ({ open: false, setOpen }),
}))

const { Search } = await import('@/components/search')

describe('Search trigger', () => {
  beforeEach(() => {
    setOpen.mockClear()
  })
  test('renders a search pill with the command shortcut and opens the palette', async () => {
    const user = userEvent.setup()
    render(<Search placeholder='Search' />)

    const trigger = screen.getByRole('button', { name: 'Search' })
    expect(trigger).toHaveTextContent('⌘K')

    await user.click(trigger)
    expect(setOpen).toHaveBeenCalledWith(true)
  })
})
