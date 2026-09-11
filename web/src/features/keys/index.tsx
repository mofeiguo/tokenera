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
import { Main } from '@/components/layout'

import { ApiKeysDialogs } from './components/api-keys-dialogs'
import { ApiKeysPageHeader } from './components/api-keys-page-header'
import { ApiKeysProvider } from './components/api-keys-provider'
import { ApiKeysTable } from './components/api-keys-table'

function ApiKeysContent() {
  return (
    <>
      <Main className='bg-background'>
        <div className='flex min-h-0 flex-1 flex-col overflow-auto px-6 py-8 md:px-10'>
          <ApiKeysPageHeader />
          <div className='mt-6 min-w-0 flex-1'>
            <ApiKeysTable />
          </div>
        </div>
      </Main>

      <ApiKeysDialogs />
    </>
  )
}

export function ApiKeys() {
  return (
    <ApiKeysProvider>
      <ApiKeysContent />
    </ApiKeysProvider>
  )
}
