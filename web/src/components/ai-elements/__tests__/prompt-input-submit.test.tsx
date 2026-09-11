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
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { PromptInput, PromptInputTextarea } = await import('../prompt-input')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        Send: 'Send',
        'Upload files': 'Upload files',
        'What would you like to know?': 'What would you like to know?',
      },
    },
  },
})

describe('PromptInput image submit', () => {
  test('converts attached images to data URLs without fetching blob URLs', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('blob URL must not be fetched'))

    render(
      <I18nextProvider i18n={i18n}>
        <PromptInput accept='image/*' multiple onSubmit={onSubmit}>
          <PromptInputTextarea />
          <button type='submit'>Send</button>
        </PromptInput>
      </I18nextProvider>
    )

    const file = new File([new Uint8Array([1, 2, 3, 4])], 'dot.png', {
      type: 'image/png',
    })
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await user.upload(input, file)
    await user.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })

    const message = onSubmit.mock.calls[0]?.[0] as {
      files?: Array<{ url?: string; mediaType?: string; filename?: string }>
    }
    expect(message.files?.[0]?.filename).toBe('dot.png')
    expect(message.files?.[0]?.mediaType).toBe('image/png')
    expect(message.files?.[0]?.url).toMatch(/^data:image\/png;base64,/)
    expect(fetchSpy).not.toHaveBeenCalled()

    fetchSpy.mockRestore()
  })
})
