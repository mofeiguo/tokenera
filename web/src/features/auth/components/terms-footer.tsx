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

import { cn } from '@/lib/utils'

import type { SystemStatus } from '../types'

interface TermsFooterProps {
  variant?: 'sign-in' | 'sign-up' | 'zenmux'
  className?: string
  status?: SystemStatus | null
}

export function TermsFooter({
  variant = 'sign-in',
  className,
  status,
}: TermsFooterProps) {
  const { t } = useTranslation()
  const text =
    variant === 'zenmux'
      ? 'By continuing, you agree to our'
      : variant === 'sign-in'
        ? 'By clicking sign in, you agree to our'
        : 'By creating an account, you agree to our'

  const hasUserAgreement = Boolean(status?.user_agreement_enabled)
  const hasPrivacyPolicy = Boolean(status?.privacy_policy_enabled)

  if (!hasUserAgreement && !hasPrivacyPolicy) {
    return null
  }

  const agreementLink = {
    label: 'User Agreement',
    href: '/user-agreement',
  }
  const privacyLink = {
    label: 'Privacy Policy',
    href: '/privacy-policy',
  }

  const activeLinks =
    hasUserAgreement || hasPrivacyPolicy
      ? ([
          hasUserAgreement ? agreementLink : null,
          hasPrivacyPolicy ? privacyLink : null,
        ].filter(Boolean) as Array<{ label: string; href: string }>)
      : [agreementLink, privacyLink]

  const [firstLink, secondLink] = activeLinks

  return (
    <p
      className={cn(
        'text-muted-foreground text-xs',
        variant === 'zenmux' ? 'text-center leading-5' : 'text-center',
        className
      )}
    >
      {variant === 'zenmux' ? (
        <>
          <span>{t(text)}</span>
          {firstLink && (
            <>
              {' '}
              <a
                href={firstLink.href}
                target='_blank'
                rel='noreferrer'
                className='text-foreground hover:text-foreground/80 underline underline-offset-4'
              >
                {t(firstLink.label)}
              </a>
            </>
          )}
          {secondLink && (
            <>
              <span>{t('and')}</span>
              {' '}
              <a
                href={secondLink.href}
                target='_blank'
                rel='noreferrer'
                className='text-foreground hover:text-foreground/80 underline underline-offset-4'
              >
                {t(secondLink.label)}
              </a>
            </>
          )}
        </>
      ) : (
        <>
          {text}{' '}
          {firstLink && (
            <a
              href={firstLink.href}
              className='hover:text-primary underline underline-offset-4'
            >
              {firstLink.label}
            </a>
          )}
          {secondLink && (
            <>
              {' '}
              {t('and')}{' '}
              <a
                href={secondLink.href}
                className='hover:text-primary underline underline-offset-4'
              >
                {secondLink.label}
              </a>
            </>
          )}
          .
        </>
      )}
    </p>
  )
}
