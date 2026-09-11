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
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { AuthenticatedLayout } from '@/components/layout/components/authenticated-layout'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from '@/components/ui/command'
import { ThemeProvider } from '@/context/theme-provider'
import { Dashboard } from '@/features/dashboard'
import { QueryClient, QueryClientProvider } from '@/lib/query'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

function renderAuthenticatedShell(content: ReactNode) {
  const queryClient = new QueryClient()
  const router = createMemoryRouter(
    [
      {
        path: '/dashboard/:section',
        element: <AuthenticatedLayout>{content}</AuthenticatedLayout>,
      },
    ],
    { initialEntries: ['/dashboard/overview'] }
  )

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

describe('authenticated console shell', () => {
  beforeEach(() => {
    useAuthStore.setState((state) => ({
      auth: {
        ...state.auth,
        user: {
          id: 1,
          username: 'admin',
          role: ROLE.ADMIN,
        },
        accessToken: 'test-token',
        accessExpiresAt: Date.now() + 60_000,
      },
    }))
  })

  afterEach(() => {
    useAuthStore.getState().auth.reset()
  })

  test('renders sidebar and header without crashing', () => {
    renderAuthenticatedShell(<div>dashboard-ok</div>)

    expect(screen.getByText('dashboard-ok')).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Toggle sidebar' }).length
    ).toBeGreaterThan(0)
  })

  test('places the brand in the full-width platform header', () => {
    renderAuthenticatedShell(<div>dashboard-ok</div>)

    const banner = screen.getByRole('banner')
    expect(banner).toContainElement(
      screen.getByRole('link', { name: 'Go to home' })
    )
  })

  test('renders the overview dashboard without crashing', () => {
    renderAuthenticatedShell(<Dashboard />)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getAllByText('Create API Key').length).toBeGreaterThan(0)
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
  })
})

describe('command dialog', () => {
  test('renders an open command palette without crashing', () => {
    render(
      <CommandDialog open onOpenChange={() => undefined}>
        <Command>
          <CommandInput placeholder='Type a command or search...' />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
          </CommandList>
        </Command>
      </CommandDialog>
    )

    expect(
      screen.getByPlaceholderText('Type a command or search...')
    ).toBeInTheDocument()
  })
})

describe('collapsible render compatibility', () => {
  test('merges render onto a single wrapper with trigger and content', () => {
    render(
      <ul>
        <Collapsible defaultOpen render={<li data-testid='collapsible-item' />}>
          <CollapsibleTrigger>Open section</CollapsibleTrigger>
          <CollapsibleContent>Section body</CollapsibleContent>
        </Collapsible>
      </ul>
    )

    const item = screen.getByTestId('collapsible-item')
    expect(item.tagName).toBe('LI')
    expect(screen.getByText('Open section')).toBeInTheDocument()
    expect(screen.getByText('Section body')).toBeInTheDocument()
  })
})
