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
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Link } from '@/lib/router'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout(props: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()

  return (
    <div className='zen-atmosphere relative min-h-svh overflow-hidden'>
      <div
        aria-hidden
        className='zen-grid-fade pointer-events-none absolute inset-0 opacity-60'
      />
      <header className='relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6'>
        <Link
          to='/'
          className='focus-visible:ring-ring flex min-w-0 items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:outline-none'
        >
          <div className='relative size-8 shrink-0'>
            {loading ? (
              <Skeleton className='absolute inset-0 rounded-lg' />
            ) : (
              <img
                src={logo}
                alt={t('Logo')}
                className='size-8 rounded-lg object-contain'
              />
            )}
          </div>
          {loading ? (
            <Skeleton className='h-5 w-24' />
          ) : (
            <span className='truncate text-xl font-bold tracking-tight'>
              {systemName}
            </span>
          )}
        </Link>
        <div className='flex items-center gap-1'>
          <LanguageSwitcher />
          <ThemeSwitch size='compact' />
        </div>
      </header>

      <main className='relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl items-center justify-center px-4 py-8 sm:px-6 sm:py-12'>
        <section className='glass-morphism border-border/60 w-full max-w-lg rounded-2xl border p-6 shadow-[var(--shadow-card)] sm:p-9'>
          <Button
            variant='ghost'
            size='sm'
            className='text-muted-foreground mb-6 -ml-2'
            render={<Link to='/' />}
          >
            <ArrowLeft className='size-4' />
            {t('Back to Home')}
          </Button>
          {props.children}
        </section>
      </main>
    </div>
  )
}
