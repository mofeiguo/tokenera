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

import { useStatus } from '@/hooks/use-status'
import { Link } from '@/lib/router'
import { cn } from '@/lib/utils'

import { PUBLIC_BRAND_NAME } from './token-era-logo'

type SystemBrandProps = {
  defaultName?: string
  defaultVersion?: string
  /**
   * Visual layout:
   * - 'sidebar': site name + version pill in the sidebar header.
   * - 'inline': compact horizontal row (e.g. top app bar).
   */
  variant?: 'sidebar' | 'inline'
  /** Destination for the brand link. Defaults by variant. */
  to?: string
}

function formatVersionLabel(version: string): string {
  if (!version) return version
  return version.startsWith('v') ? version : `v${version}`
}

function resolveSiteName(
  systemName: string | undefined,
  defaultName: string | undefined
): string {
  const trimmed = systemName?.trim()
  if (trimmed) {
    return trimmed
  }
  return defaultName || PUBLIC_BRAND_NAME
}

/**
 * System brand — ZenMux-style site name + version badge (no logo).
 */
export function SystemBrand(props: SystemBrandProps) {
  const { t } = useTranslation()
  const { status } = useStatus()

  const variant = props.variant ?? 'sidebar'
  const name = resolveSiteName(
    status?.system_name as string | undefined,
    props.defaultName
  )
  const versionRaw =
    (status?.version as string | undefined) || props.defaultVersion
  const versionLabel = versionRaw
    ? formatVersionLabel(versionRaw)
    : props.defaultVersion
      ? formatVersionLabel(props.defaultVersion)
      : null

  const nameClassName =
    variant === 'sidebar'
      ? 'truncate text-base font-bold tracking-tight'
      : 'max-w-[14rem] truncate text-base font-bold tracking-tight'

  const homeTo = props.to ?? (variant === 'sidebar' ? '/analytics/usage' : '/')

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        variant === 'sidebar' && 'px-2 py-1 md:pl-[11px]'
      )}
    >
      <Link
        to={homeTo}
        aria-label={t('Go to home')}
        className={cn(
          'text-foreground hover:text-foreground/80 inline-flex min-w-0 items-center gap-2 transition-colors outline-none',
          'focus-visible:ring-ring/40 rounded-sm focus-visible:ring-2'
        )}
      >
        <span
          aria-hidden
          className='bg-muted text-foreground hidden size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold group-data-[collapsible=icon]:flex'
        >
          {name.charAt(0).toUpperCase()}
        </span>
        <span className={cn(nameClassName, 'group-data-[collapsible=icon]:hidden')}>
          {name}
        </span>
      </Link>
      {versionLabel ? (
        <span
          className={cn(
            'bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-1 text-xs leading-none whitespace-nowrap',
            'group-data-[collapsible=icon]:hidden'
          )}
        >
          {versionLabel}
        </span>
      ) : null}
    </div>
  )
}
