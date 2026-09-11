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
import { RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Main } from '@/components/layout/components/main'
import { Button } from '@/components/ui/button'

type AnalyticsPageShellProps = {
  children: ReactNode
  onRefresh?: () => void
  refreshing?: boolean
  title: string
  toolbar?: ReactNode
}

export function AnalyticsPageShell(props: AnalyticsPageShellProps) {
  const { t } = useTranslation()

  return (
    <Main className='bg-background'>
      <div className='flex min-h-0 flex-1 flex-col overflow-auto px-6 py-8 md:px-10'>
        <div className='flex items-center gap-2'>
          <h1 className='text-[28px] leading-none font-semibold tracking-tight text-[#333333] dark:text-foreground'>
            {props.title}
          </h1>
          {props.onRefresh ? (
            <Button
              aria-label={t('Refresh')}
              className='text-muted-foreground size-7 rounded-full'
              disabled={props.refreshing}
              onClick={props.onRefresh}
              size='icon'
              type='button'
              variant='ghost'
            >
              <RefreshCw
                className={props.refreshing ? 'size-3.5 animate-spin' : 'size-3.5'}
              />
            </Button>
          ) : null}
        </div>
        {props.toolbar}
        <div className='mt-6 min-w-0 flex-1'>{props.children}</div>
      </div>
    </Main>
  )
}
