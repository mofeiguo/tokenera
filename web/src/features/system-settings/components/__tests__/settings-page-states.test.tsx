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
import { describe, expect, it, vi } from 'vitest'

import { SettingsPage } from '../settings-page'

vi.mock('@/components/layout', () => ({
  SectionPageLayout: Object.assign(
    ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    {
      Title: ({ children }: { children: React.ReactNode }) => (
        <h1>{children}</h1>
      ),
      Actions: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      Content: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
    }
  ),
}))

vi.mock('@/lib/router', () => ({
  useParams: () => ({ section: 'general' }),
}))

const useSystemOptionsMock = vi.fn()

vi.mock('../../hooks/use-system-options', () => ({
  useSystemOptions: () => useSystemOptionsMock(),
  getOptionValue: (
    _options: unknown,
    defaults: Record<string, string>
  ): Record<string, string> => defaults,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('SettingsPage visual states', () => {
  it('renders a compact loading skeleton while options are fetching', () => {
    useSystemOptionsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    })

    render(
      <SettingsPage
        routePath='/_authenticated/system-settings/site/$section'
        defaultSettings={{ SiteName: '' }}
        defaultSection='general'
        getSectionMeta={() => ({ titleKey: 'General Settings' })}
        getSectionContent={() => <div>section-body</div>}
      />
    )

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading settings...')).toHaveClass('sr-only')
    expect(screen.queryByText('section-body')).not.toBeInTheDocument()
  })

  it('renders an inline error state with retry when options fail', () => {
    const refetch = vi.fn()
    useSystemOptionsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    })

    render(
      <SettingsPage
        routePath='/_authenticated/system-settings/site/$section'
        defaultSettings={{ SiteName: '' }}
        defaultSection='general'
        getSectionMeta={() => ({ titleKey: 'General Settings' })}
        getSectionContent={() => <div>section-body</div>}
      />
    )

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    expect(screen.queryByText('section-body')).not.toBeInTheDocument()
  })
})
