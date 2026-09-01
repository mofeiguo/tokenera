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
const { PlaygroundInputControls } = await import('../playground-input-controls')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        Endpoint: 'Endpoint',
        Chat: 'Chat',
        Response: 'Response',
        Anthropic: 'Anthropic',
        Gemini: 'Gemini',
        Send: 'Send',
        Stop: 'Stop',
      },
    },
  },
})

const models = [
  {
    label: 'claude-sonnet',
    value: 'claude-sonnet',
    supportedEndpointTypes: ['anthropic', 'openai'],
  },
]

const groups = [{ label: 'default', value: 'default', ratio: 1 }]

function renderControls(
  overrides: Partial<Parameters<typeof PlaygroundInputControls>[0]> = {}
) {
  const onEndpointChange = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <PlaygroundInputControls
        endpointValue='anthropic'
        groups={groups}
        groupValue='default'
        models={models}
        modelValue='claude-sonnet'
        onEndpointChange={onEndpointChange}
        onGroupChange={() => undefined}
        onModelChange={() => undefined}
        text='hello'
        tools={null}
        {...overrides}
      />
    </I18nextProvider>
  )
  return { onEndpointChange }
}

describe('PlaygroundInputControls endpoint selector', () => {
  test('lets the user switch among the model catalog endpoints', async () => {
    const user = userEvent.setup()
    const { onEndpointChange } = renderControls()

    const trigger = screen.getAllByLabelText('Endpoint')[0]
    expect(trigger).toHaveDisplayValue('Anthropic')
    expect(trigger).toBeEnabled()

    await user.selectOptions(trigger, 'openai')

    expect(onEndpointChange).toHaveBeenCalledWith('openai')
  })

  test('disables the selector when the model has a single chat endpoint', () => {
    renderControls({
      models: [
        {
          label: 'claude-sonnet',
          value: 'claude-sonnet',
          supportedEndpointTypes: ['anthropic'],
        },
      ],
      endpointValue: 'anthropic',
    })

    expect(screen.getAllByLabelText('Endpoint')[0]).toBeDisabled()
  })
})
