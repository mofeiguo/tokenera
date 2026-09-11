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

vi.mock('@/components/model-group-selector/model-display', () => ({
  ModelSelectorIcon: () => <span data-testid='model-icon' />,
}))

const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { PlaygroundEmptyState } = await import('../playground-empty-state')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        Audio: 'Audio',
        Capabilities: 'Capabilities',
        File: 'File',
        Image: 'Image',
        Input: 'Input',
        Output: 'Output',
        Protocols: 'Protocols',
        'Select a model to start': 'Select a model to start',
        Text: 'Text',
        Tools: 'Tools',
        Video: 'Video',
        'Web search': 'Web search',
      },
    },
  },
})

describe('PlaygroundEmptyState', () => {
  test('asks the user to pick a model when none is selected', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <PlaygroundEmptyState models={[]} modelValue='' />
      </I18nextProvider>
    )

    expect(screen.getByText('Select a model to start')).toBeInTheDocument()
  })

  test('shows the selected model card with real metadata only', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <PlaygroundEmptyState
          modelValue='gpt-4o'
          models={[
            {
              capabilities: ['web_search'],
              inputModalities: ['text', 'image'],
              label: 'gpt-4o',
              outputModalities: ['text'],
              value: 'gpt-4o',
              vendorName: 'OpenAI',
            },
          ]}
        />
      </I18nextProvider>
    )

    expect(screen.getByRole('heading', { name: 'gpt-4o' })).toBeInTheDocument()
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
    expect(screen.getByText('Text · Image')).toBeInTheDocument()
    expect(screen.getByText('Web search')).toBeInTheDocument()
    expect(screen.queryByText('What can I help with?')).not.toBeInTheDocument()
  })
})
