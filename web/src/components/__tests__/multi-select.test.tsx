/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
    10|but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, test } from 'vitest'

import { MultiSelect } from '@/components/multi-select'

const OPTIONS = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'claude', label: 'Claude' },
]

function Harness(props: { allowCreate?: boolean; initialSelected?: string[] }) {
  const [selected, setSelected] = useState(props.initialSelected ?? [])

  return (
    <>
      <MultiSelect
        options={OPTIONS}
        selected={selected}
        onChange={setSelected}
        allowCreate={props.allowCreate}
        placeholder='Select models'
      />
      <output data-testid='selected-values'>{selected.join(',')}</output>
    </>
  )
}

describe('MultiSelect', () => {
  test('selecting an option adds it to the selected values', async () => {
    render(<Harness />)

    fireEvent.focus(screen.getByRole('combobox', { name: 'Select models' }))
    fireEvent.click(await screen.findByRole('option', { name: 'GPT-4' }))

    expect(screen.getByTestId('selected-values')).toHaveTextContent('gpt-4')
  })

  test('backspace on an empty input removes the last selected value', () => {
    render(<Harness initialSelected={['gpt-4', 'claude']} />)

    const input = screen.getByRole('combobox', { name: 'Select models' })
    fireEvent.keyDown(input, { key: 'Backspace' })

    expect(screen.getByTestId('selected-values')).toHaveTextContent('gpt-4')
  })

  test('comma-separated input commits new values when create is allowed', () => {
    render(<Harness allowCreate />)

    const input = screen.getByRole('combobox', { name: 'Select models' })
    fireEvent.change(input, { target: { value: 'custom-a,custom-b,' } })

    expect(screen.getByTestId('selected-values')).toHaveTextContent(
      'custom-a,custom-b'
    )
  })
})
