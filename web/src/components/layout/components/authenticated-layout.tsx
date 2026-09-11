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
import { AnimatedOutlet } from '@/components/page-transition'
import { SkipToMain } from '@/components/skip-to-main'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'

import { AppSidebar } from './app-sidebar'
import { PublicHeader } from './public-header'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout(props: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      className='flex h-svh flex-col overflow-hidden'
      style={
        {
          '--sidebar-offset-top': 'var(--app-header-height)',
        } as React.CSSProperties
      }
    >
      <SkipToMain />
      <PublicHeader variant='platform' homeUrl='/analytics/usage' />
      <div className='flex min-h-0 min-w-0 flex-1 overflow-hidden'>
        <AppSidebar />
        <SidebarInset
          className={cn(
            '@container/content',
            'flex min-h-0 flex-1 flex-col overflow-hidden'
          )}
        >
          {props.children ?? <AnimatedOutlet />}
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
