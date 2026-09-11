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
const { PromptInput } = await import('@/components/ai-elements/prompt-input')
const { PlaygroundComposerActions } = await import(
  '../playground-composer-actions'
)

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
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
    supportedEndpointTypes: ['anthropic'],
  },
]

function renderComposerActions(
  overrides: Partial<Parameters<typeof PlaygroundComposerActions>[0]> = {}
) {
  render(
    <I18nextProvider i18n={i18n}>
      <PromptInput onSubmit={() => undefined}>
        <PlaygroundComposerActions
          inputModalities={['text', 'image']}
          modelValue='claude-sonnet'
          models={models}
          text=''
          {...overrides}
        />
      </PromptInput>
    </I18nextProvider>
  )
}

describe('PlaygroundComposerActions', () => {
  test('disables send when input is empty', () => {
    renderComposerActions({ text: '' })

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
  })

  test('enables send when input has text', () => {
    renderComposerActions({ text: 'hello' })

    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled()
  })

  test('shows stop button while generating', async () => {
    const user = userEvent.setup()
    const onStop = vi.fn()
    renderComposerActions({
      inputModalities: ['text', 'image'],
      isGenerating: true,
      onStop,
      text: 'hello',
    })

    const stopButton = screen.getByRole('button', { name: 'Stop' })
    expect(stopButton).toBeEnabled()

    await user.click(stopButton)
    expect(onStop).toHaveBeenCalledTimes(1)
  })
})
