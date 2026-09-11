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

import { getPublicBrandLabel } from '@/components/layout/components/public-brand-mark'
import { useStatus } from '@/hooks/use-status'
import { Link, useSearch } from '@/lib/router'

import { TermsFooter } from '../components/terms-footer'
import { SignInLayout } from './components/sign-in-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { t } = useTranslation()
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })
  const { status } = useStatus()
  const brandLabel = getPublicBrandLabel(status?.system_name as string | undefined)

  return (
    <SignInLayout
      footer={
        <TermsFooter variant='zenmux' status={status} className='text-center' />
      }
    >
      <div className='space-y-8'>
        <header className='space-y-2 text-left'>
          <h1 className='text-foreground text-[28px] leading-tight font-semibold tracking-[-0.02em]'>
            {t('Welcome to {{name}}', { name: brandLabel })}
          </h1>
          <p className='text-muted-foreground text-sm leading-6'>
            {t('Continue with GitHub or email.')}
          </p>
        </header>

        <UserAuthForm redirectTo={redirect} variant='zenmux' />

        {!status?.self_use_mode_enabled &&
          status?.register_enabled !== false && (
            <p className='text-muted-foreground text-center text-sm'>
              {t("Don't have an account?")}{' '}
              <Link
                to='/sign-up'
                className='text-foreground hover:text-foreground/80 font-medium underline underline-offset-4'
              >
                {t('Sign up')}
              </Link>
            </p>
          )}
      </div>
    </SignInLayout>
  )
}
