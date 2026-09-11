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
import { useTranslation } from 'react-i18next'

import { getPublicBrandLabel, PublicBrandMark } from '@/components/layout/components/public-brand-mark'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeSwitch } from '@/components/theme-switch'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Link } from '@/lib/router'

type SignInLayoutProps = {
  children: React.ReactNode
  footer?: React.ReactNode
}

export function SignInLayout(props: SignInLayoutProps) {
  const { t } = useTranslation()
  const { systemName } = useSystemConfig()
  const brandLabel = getPublicBrandLabel(systemName)

  return (
    <div className='bg-background flex min-h-svh flex-col'>
      <header className='border-border/60 flex h-16 shrink-0 items-center justify-between border-b px-6 sm:px-10'>
        <Link
          to='/'
          className='focus-visible:ring-ring inline-flex rounded-md focus-visible:ring-2 focus-visible:outline-none'
          aria-label={t('Go to {{name}} home', { name: brandLabel })}
        >
          <PublicBrandMark className='h-10' />
        </Link>

        <div className='flex items-center gap-1'>
          <LanguageSwitcher icon='globe' />
          <ThemeSwitch variant='toolbar' />
        </div>
      </header>

      <main className='flex flex-1 items-center justify-center px-6 py-10 sm:px-10'>
        <div className='w-full max-w-[400px]'>
          {props.children}

          {props.footer ? (
            <footer className='text-muted-foreground mt-10 text-center text-xs leading-5'>
              {props.footer}
            </footer>
          ) : null}
        </div>
      </main>
    </div>
  )
}
