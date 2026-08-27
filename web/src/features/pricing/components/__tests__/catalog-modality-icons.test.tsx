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
import { describe, expect, test } from 'vitest'

import { CatalogModalityFlow } from '../catalog-modality-icons'

const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { TooltipProvider } = await import('@/components/ui/tooltip')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        Input: 'Input',
        Output: 'Output',
        Text: 'Text',
        Image: 'Image',
        File: 'File',
        Audio: 'Audio',
        Video: 'Video',
      },
    },
  },
})

function FlowHarness(props: { input: string[]; output: string[] }) {
  return (
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>
        <CatalogModalityFlow input={props.input} output={props.output} />
      </TooltipProvider>
    </I18nextProvider>
  )
}

describe('CatalogModalityFlow', () => {
  test('renders input icons, an arrow, and output icons with distinct names', () => {
    render(<FlowHarness input={['text', 'image', 'file']} output={['text']} />)

    const flow = document.querySelector('[data-slot="catalog-modality-flow"]')
    expect(flow).not.toBeNull()
    expect(flow?.textContent).toContain('→')

    const labels = screen
      .getAllByRole('img')
      .map((node) => node.getAttribute('aria-label'))
    expect(labels).toEqual([
      'Input · File',
      'Input · Image',
      'Input · Text',
      'Output · Text',
    ])
  })

  test('hides the arrow when the model has only output modalities', () => {
    render(<FlowHarness input={[]} output={['audio']} />)

    const flow = document.querySelector('[data-slot="catalog-modality-flow"]')
    expect(flow?.textContent).not.toContain('→')
    expect(
      screen.getByRole('img', { name: 'Output · Audio' })
    ).toBeInTheDocument()
  })
})
