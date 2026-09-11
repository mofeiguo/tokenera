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
import { useState } from 'react'

import { Main } from '@/components/layout'
import { PageFooterProvider } from '@/components/layout/components/page-footer'

import { ChannelsDialogs } from './components/channels-dialogs'
import { ChannelsPageHeader } from './components/channels-page-header'
import { ChannelsProvider } from './components/channels-provider'
import { ChannelsTable } from './components/channels-table'

function ChannelsContent() {
  const [footerContainer, setFooterContainer] = useState<HTMLDivElement | null>(
    null
  )

  return (
    <>
      <PageFooterProvider container={footerContainer}>
        <Main>
          <div className='shrink-0 px-[var(--page-padding-x)] pt-6 pb-4 md:pt-8'>
            <ChannelsPageHeader />
          </div>
          <div className='min-h-0 flex-1 overflow-hidden px-[var(--page-padding-x)] pb-[var(--page-padding-y)]'>
            <ChannelsTable />
          </div>
          <div
            ref={setFooterContainer}
            className='bg-background shrink-0 border-t px-[var(--page-padding-x)] py-3 empty:hidden'
          />
        </Main>
      </PageFooterProvider>

      <ChannelsDialogs />
    </>
  )
}

export function Channels() {
  return (
    <ChannelsProvider>
      <ChannelsContent />
    </ChannelsProvider>
  )
}
