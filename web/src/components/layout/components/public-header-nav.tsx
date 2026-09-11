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

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link, useRouterState } from '@/lib/router'
import { cn } from '@/lib/utils'

import { buildPublicNavEntries, type PublicNavEntry } from '../lib/public-nav-entries'
import { PublicHeaderNavChevron } from './public-header-menu-icon'
import type { TopNavLink } from '../types'

const navLinkClassName =
  'inline-flex items-center gap-0.5 py-4 text-base font-normal leading-none tracking-[-0.02em] whitespace-nowrap transition-colors duration-150'

function NavLabel(props: { children: React.ReactNode }) {
  return (
    <span className='inline-block scale-y-[0.96] transform'>{props.children}</span>
  )
}

type PublicHeaderNavProps = {
  links: TopNavLink[]
  onLinkClick: (
    event: React.MouseEvent<HTMLAnchorElement>,
    link: TopNavLink,
    closeMobile?: boolean
  ) => void
  className?: string
  menuItemClassName?: string
}

function isLinkActive(pathname: string, link: TopNavLink) {
  if (link.external) return false
  if (link.href === '/') return pathname === '/'
  return pathname === link.href || pathname.startsWith(`${link.href}/`)
}

function isMenuActive(pathname: string, links: TopNavLink[]) {
  return links.some((link) => isLinkActive(pathname, link))
}

function renderNavLink(
  link: TopNavLink,
  pathname: string,
  onLinkClick: PublicHeaderNavProps['onLinkClick'],
  t: (key: string) => string,
  options?: { closeMobile?: boolean; className?: string }
) {
  const active = isLinkActive(pathname, link)
  const className = cn(
    navLinkClassName,
    active
      ? 'text-foreground'
      : 'text-muted-foreground hover:text-foreground',
    link.disabled && 'pointer-events-none opacity-50',
    options?.className
  )

  if (link.external) {
    return (
      <a
        key={`${link.href}-${link.title}`}
        href={link.href}
        target='_blank'
        rel='noopener noreferrer'
        aria-disabled={link.disabled}
        tabIndex={link.disabled ? -1 : undefined}
        onClick={(event) => onLinkClick(event, link, options?.closeMobile)}
        className={className}
      >
        <NavLabel>{t(link.title)}</NavLabel>
      </a>
    )
  }

  return (
    <Link
      key={`${link.href}-${link.title}`}
      to={link.href}
      aria-current={active ? 'page' : undefined}
      disabled={link.disabled}
      onClick={(event) => onLinkClick(event, link, options?.closeMobile)}
      className={className}
    >
      <NavLabel>{t(link.title)}</NavLabel>
    </Link>
  )
}

function renderMenuEntry(
  entry: Extract<PublicNavEntry, { kind: 'menu' }>,
  pathname: string,
  onLinkClick: PublicHeaderNavProps['onLinkClick'],
  t: (key: string) => string
) {
  const active = isMenuActive(pathname, entry.links)

  return (
    <DropdownMenu key={`menu-${entry.title}`} modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            type='button'
            variant='ghost'
            className={cn(
              navLinkClassName,
              'h-auto px-0 font-normal hover:bg-transparent',
              active
                ? 'text-foreground cursor-default'
                : 'text-muted-foreground hover:text-foreground'
            )}
          />
        }
      >
        <NavLabel>{t(entry.title)}</NavLabel>
        <PublicHeaderNavChevron className='mt-0.5 ml-0.5 size-3.5 rotate-180 text-[#c8c8c8] transition-transform duration-200 group-data-[state=open]:rotate-0' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='center' className='min-w-40'>
        {entry.links.map((link) => (
          <DropdownMenuItem
            key={`${link.href}-${link.title}`}
            className='p-0'
            onClick={(event) => {
              if (link.external || link.disabled || link.requiresAuth) {
                event.preventDefault()
                onLinkClick(
                  event as unknown as React.MouseEvent<HTMLAnchorElement>,
                  link
                )
              }
            }}
          >
            {link.external ? (
              <a
                href={link.href}
                target='_blank'
                rel='noopener noreferrer'
                className='flex w-full px-2 py-1.5 text-sm'
              >
                {t(link.title)}
              </a>
            ) : (
              <Link
                to={link.href}
                disabled={link.disabled}
                className='flex w-full px-2 py-1.5 text-sm'
                onClick={(event) => onLinkClick(event, link)}
              >
                {t(link.title)}
              </Link>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function PublicHeaderNav(props: PublicHeaderNavProps) {
  const { links, onLinkClick, className } = props
  const { t } = useTranslation()
  const pathname = useRouterState().location.pathname
  const entries = buildPublicNavEntries(links)

  return (
    <nav
      aria-label={t('Main navigation')}
      className={cn('flex items-center gap-6 [font-stretch:85%]', className)}
    >
      {entries.map((entry) => {
        if (entry.kind === 'menu') {
          return renderMenuEntry(entry, pathname, onLinkClick, t)
        }
        return renderNavLink(entry.link, pathname, onLinkClick, t)
      })}
    </nav>
  )
}

export function PublicHeaderMobileNav(props: PublicHeaderNavProps) {
  const { links, onLinkClick, className, menuItemClassName } = props
  const { t } = useTranslation()
  const pathname = useRouterState().location.pathname
  const entries = buildPublicNavEntries(links)

  return (
    <nav className={cn('flex flex-col gap-1', className)}>
      {entries.flatMap((entry, entryIndex) => {
        if (entry.kind === 'menu') {
          return entry.links.map((link, linkIndex) => {
            const isActive = isLinkActive(pathname, link)
            const className = cn(
              'flex items-center gap-3 py-3 text-base font-medium tracking-tight transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
              menuItemClassName,
              isActive ? 'text-foreground' : 'text-muted-foreground',
              link.disabled && 'pointer-events-none opacity-50'
            )
            const style = {
              transitionDelay: `${100 + (entryIndex + linkIndex) * 50}ms`,
            }

            if (link.external) {
              return (
                <a
                  key={`${link.href}-${link.title}`}
                  href={link.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-disabled={link.disabled}
                  tabIndex={link.disabled ? -1 : undefined}
                  onClick={(event) => onLinkClick(event, link, true)}
                  className={className}
                  style={style}
                >
                  {t(link.title)}
                </a>
              )
            }

            return (
              <Link
                key={`${link.href}-${link.title}`}
                to={link.href}
                aria-current={isActive ? 'page' : undefined}
                disabled={link.disabled}
                onClick={(event) => onLinkClick(event, link, true)}
                className={className}
                style={style}
              >
                {t(link.title)}
              </Link>
            )
          })
        }

        const link = entry.link
        const isActive = isLinkActive(pathname, link)
        const className = cn(
          'flex items-center gap-3 py-3 text-base font-medium tracking-tight transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          menuItemClassName,
          isActive ? 'text-foreground' : 'text-muted-foreground',
          link.disabled && 'pointer-events-none opacity-50'
        )
        const style = {
          transitionDelay: `${100 + entryIndex * 50}ms`,
        }

        if (link.external) {
          return (
            <a
              key={`${link.href}-${link.title}`}
              href={link.href}
              target='_blank'
              rel='noopener noreferrer'
              aria-disabled={link.disabled}
              tabIndex={link.disabled ? -1 : undefined}
              onClick={(event) => onLinkClick(event, link, true)}
              className={className}
              style={style}
            >
              {t(link.title)}
            </a>
          )
        }

        return (
          <Link
            key={`${link.href}-${link.title}`}
            to={link.href}
            aria-current={isActive ? 'page' : undefined}
            disabled={link.disabled}
            onClick={(event) => onLinkClick(event, link, true)}
            className={className}
            style={style}
          >
            {t(link.title)}
          </Link>
        )
      })}
    </nav>
  )
}
