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
import { describe, expect, test, vi } from 'vitest'

vi.mock('@/components/model-group-selector', () => ({
  ModelGroupSelector: () => <div data-testid='model-group-selector' />,
}))

vi.mock('../input/playground-parameter-panel', () => ({
  PlaygroundParameterPanel: () => (
    <button aria-label='Parameters' type='button'>
      Parameters
    </button>
  ),
}))

const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { PlaygroundToolbar } = await import('../playground-toolbar')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        Parameters: 'Parameters',
        'Clear chat history': 'Clear chat history',
      },
    },
  },
})

const defaultConfig = {
  endpointType: 'anthropic' as const,
  model: 'claude-sonnet',
  systemPrompt: '',
  temperature: 1,
  topP: 1,
  maxTokens: 4096,
  frequencyPenalty: 0,
  presencePenalty: 0,
}

const models = [
  {
    label: 'claude-sonnet',
    value: 'claude-sonnet',
    supportedEndpointTypes: ['anthropic', 'openai'],
  },
]

describe('PlaygroundToolbar', () => {
  test('does not render protocol in the top toolbar', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <PlaygroundToolbar
          config={defaultConfig}
          endpointValue='anthropic'
          models={models}
          modelValue='claude-sonnet'
          onClearMessages={() => undefined}
          onConfigChange={() => undefined}
          onEndpointChange={() => undefined}
          onModelChange={() => undefined}
          onParameterEnabledChange={() => undefined}
          parameterEnabled={{
            temperature: false,
            topP: false,
            maxTokens: false,
            frequencyPenalty: false,
            presencePenalty: false,
          }}
        />
      </I18nextProvider>
    )

    expect(screen.queryByLabelText('Protocol')).not.toBeInTheDocument()
    expect(screen.getByTestId('model-group-selector')).toBeInTheDocument()
    expect(screen.getByLabelText('Parameters')).toBeInTheDocument()
  })
})
