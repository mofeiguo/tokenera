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
import { describe, expect, test, vi } from 'vitest'

const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { PlaygroundProtocolSelector } = await import(
  '../playground-protocol-selector'
)

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        Protocol: 'Protocol',
        'Anthropic Messages': 'Anthropic Messages',
        'OpenAI Chat Completions': 'OpenAI Chat Completions',
      },
    },
  },
})

describe('PlaygroundProtocolSelector', () => {
  test('renders the protocol label and selected value', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <PlaygroundProtocolSelector
          endpointTypes={['anthropic', 'openai']}
          onChange={vi.fn()}
          value='anthropic'
        />
      </I18nextProvider>
    )

    expect(screen.getByText('Protocol')).toBeInTheDocument()
    expect(screen.getByLabelText('Protocol')).toHaveDisplayValue(
      'Anthropic Messages'
    )
  })

  test('calls onChange when a new protocol is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <I18nextProvider i18n={i18n}>
        <PlaygroundProtocolSelector
          endpointTypes={['anthropic', 'openai']}
          onChange={onChange}
          value='anthropic'
        />
      </I18nextProvider>
    )

    await user.selectOptions(screen.getByLabelText('Protocol'), 'openai')

    expect(onChange).toHaveBeenCalledWith('openai')
  })
})
