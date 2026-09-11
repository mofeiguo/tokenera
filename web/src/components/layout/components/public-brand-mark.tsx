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

import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_LOGO } from '@/lib/constants'
import { useSystemConfig } from '@/hooks/use-system-config'
import { cn } from '@/lib/utils'

import { HeaderLogo } from './header-logo'
import { PUBLIC_BRAND_NAME, TokenEraLogo } from './token-era-logo'

type PublicBrandMarkProps = {
  logo?: React.ReactNode
  siteName?: string
  className?: string
  logoClassName?: string
  textClassName?: string
}

export function PublicBrandMark(props: PublicBrandMarkProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading, logoLoaded } = useSystemConfig()

  if (props.logo) {
    return <>{props.logo}</>
  }

  if (loading) {
    return (
      <Skeleton
        className={cn('h-10 w-28 rounded-md', props.className)}
        aria-hidden
      />
    )
  }

  const displayName = props.siteName?.trim() || systemName?.trim()
  if (props.siteName?.trim()) {
    return (
      <span
        className={cn(
          'text-lg font-bold tracking-tight',
          props.textClassName,
          props.className
        )}
      >
        {props.siteName}
      </span>
    )
  }

  const logoUrl = logo?.trim()
  const hasCustomLogo = Boolean(logoUrl && logoUrl !== DEFAULT_LOGO)

  if (hasCustomLogo && logoUrl) {
    return (
      <span
        className={cn(
          'relative inline-flex h-10 w-auto max-w-[10rem] items-center',
          props.className
        )}
      >
        <HeaderLogo
          src={logoUrl}
          alt={displayName || t('Logo')}
          loading={loading}
          logoLoaded={logoLoaded}
          className={cn('h-10 w-auto max-w-[10rem] object-contain', props.logoClassName)}
        />
        {!logoLoaded ? (
          <Skeleton className='absolute inset-0 rounded-md' aria-hidden />
        ) : null}
      </span>
    )
  }

  if (displayName) {
    return (
      <span
        className={cn(
          'text-lg font-bold tracking-tight',
          props.textClassName,
          props.className
        )}
      >
        {displayName}
      </span>
    )
  }

  return <TokenEraLogo className={props.className} />
}

export function getPublicBrandLabel(
  systemName: string | undefined,
  fallback = PUBLIC_BRAND_NAME
): string {
  const trimmed = systemName?.trim()
  return trimmed || fallback
}
