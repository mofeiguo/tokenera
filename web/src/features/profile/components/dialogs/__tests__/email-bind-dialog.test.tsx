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

const sendEmailVerification = vi.fn()
const bindEmail = vi.fn()
const setTurnstileToken = vi.fn()
const validateTurnstile = vi.fn(() => true)

vi.mock('../../../api', () => ({
  sendEmailVerification: (...args: unknown[]) => sendEmailVerification(...args),
  bindEmail: (...args: unknown[]) => bindEmail(...args),
}))

vi.mock('@/features/auth/hooks/use-turnstile', () => ({
  useTurnstile: () => ({
    isTurnstileEnabled: true,
    turnstileSiteKey: 'test-site-key',
    turnstileToken: 'turnstile-token',
    setTurnstileToken,
    validateTurnstile,
  }),
}))

vi.mock('@/components/turnstile', () => ({
  Turnstile: () => <div data-testid='turnstile-widget' />,
}))

const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { EmailBindDialog } = await import('../email-bind-dialog')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        'Bind Email': 'Bind Email',
        'Bind an email address to your account.':
          'Bind an email address to your account.',
        'Email Address': 'Email Address',
        'Enter your email': 'Enter your email',
        'Verification Code': 'Verification Code',
        'Enter code': 'Enter code',
        Send: 'Send',
        Cancel: 'Cancel',
        'Verification code sent! Please check your email.':
          'Verification code sent! Please check your email.',
      },
    },
  },
})

describe('email bind dialog', () => {
  beforeEach(() => {
    sendEmailVerification.mockReset()
    bindEmail.mockReset()
    setTurnstileToken.mockReset()
    validateTurnstile.mockReset()
    validateTurnstile.mockReturnValue(true)
    sendEmailVerification.mockResolvedValue({ success: true })
  })

  test('sends the turnstile token with the verification request', async () => {
    const user = userEvent.setup()

    render(
      <I18nextProvider i18n={i18n}>
        <EmailBindDialog open onOpenChange={() => undefined} onSuccess={() => undefined} />
      </I18nextProvider>
    )

    await user.type(
      screen.getByLabelText('Email Address'),
      'bind-test@example.com'
    )
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(validateTurnstile).toHaveBeenCalled()
    expect(sendEmailVerification).toHaveBeenCalledWith(
      'bind-test@example.com',
      'turnstile-token'
    )
  })
})
