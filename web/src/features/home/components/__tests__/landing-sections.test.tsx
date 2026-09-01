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
import type { ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, test } from 'vitest'

const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')

const { Hero } = await import('../sections/hero')
const { HowItWorks } = await import('../sections/how-it-works')
const { CTA } = await import('../sections/cta')

const translations = {
  'Change models, not your integration.':
    'Change models, not your integration.',
  'Create your API key': 'Create your API key',
  'Open Playground': 'Open Playground',
  'Compare models and pricing': 'Compare models and pricing',
  Model: 'Model',
  'Token usage': 'Token usage',
  Cost: 'Cost',
  Trace: 'Trace',
  'Your first request needs one key.': 'Your first request needs one key.',
}

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: translations } },
})

function renderOnRoute(ui: ReactNode) {
  const router = createMemoryRouter([{ path: '/', element: ui }], {
    initialEntries: ['/'],
  })
  return render(
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nextProvider>
  )
}

describe('Home landing sections', () => {
  test('unauthenticated hero leads with the integration promise', () => {
    renderOnRoute(<Hero />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Change models, not your integration.',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Create your API key' })
    ).toHaveAttribute('href', '/sign-up')
    expect(
      screen.getByRole('link', { name: 'Compare models and pricing' })
    ).toHaveAttribute('href', '/pricing')
  })

  test('authenticated hero sends the primary action to the playground', () => {
    renderOnRoute(<Hero isAuthenticated />)

    expect(
      screen.getByRole('link', { name: 'Open Playground' })
    ).toHaveAttribute('href', '/playground')
  })

  test('hero lists model families and a see-all link', () => {
    renderOnRoute(<Hero />)

    expect(screen.getByText('MiniMax')).toBeInTheDocument()
  })

  test('usage section lists the recorded billing fields', () => {
    renderOnRoute(<HowItWorks />)

    expect(screen.getByText('Model')).toBeInTheDocument()
    expect(screen.getByText('Token usage')).toBeInTheDocument()
    expect(screen.getByText('Cost')).toBeInTheDocument()
    expect(screen.getByText('Trace')).toBeInTheDocument()
  })

  test('closing CTA is shown before sign-in', () => {
    renderOnRoute(<CTA />)
    expect(
      screen.getByRole('heading', { name: 'Your first request needs one key.' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Create your API key' })
    ).toHaveAttribute('href', '/sign-up')
  })

  test('closing CTA is omitted for signed-in users', () => {
    renderOnRoute(<CTA isAuthenticated />)
    expect(
      screen.queryByRole('heading', {
        name: 'Your first request needs one key.',
      })
    ).not.toBeInTheDocument()
  })
})
