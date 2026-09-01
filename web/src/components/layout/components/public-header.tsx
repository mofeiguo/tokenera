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
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationPopover } from '@/components/notification-popover'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotifications } from '@/hooks/use-notifications'
import { useSystemConfig } from '@/hooks/use-system-config'
import { useTopNavLinks } from '@/hooks/use-top-nav-links'
import { Link, useNavigate, useRouterState } from '@/lib/router'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import { defaultTopNavLinks } from '../config/top-nav.config'
import type { TopNavLink } from '../types'
import { HeaderLogo } from './header-logo'

const AUTH_PROMPT_SECONDS = 5
const MOBILE_MENU_ID = 'public-mobile-navigation'

type AuthPromptTarget = {
  title: string
  href: string
}

export interface PublicHeaderProps {
  navLinks?: TopNavLink[]
  mobileLinks?: TopNavLink[]
  navContent?: React.ReactNode
  showLanguageSwitcher?: boolean
  logo?: React.ReactNode
  siteName?: string
  homeUrl?: string
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
  showNavigation?: boolean
  showAuthButtons?: boolean
  showNotifications?: boolean
  className?: string
}

export function PublicHeader(props: PublicHeaderProps) {
  const {
    navLinks = defaultTopNavLinks,
    showLanguageSwitcher = true,
    logo: customLogo,
    siteName: customSiteName,
    homeUrl = '/',
    showAuthButtons = true,
    showNotifications = true,
  } = props

  const { t } = useTranslation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authPromptTarget, setAuthPromptTarget] =
    useState<AuthPromptTarget | null>(null)
  const [authPromptSecondsLeft, setAuthPromptSecondsLeft] =
    useState(AUTH_PROMPT_SECONDS)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileTriggerRef = useRef<HTMLButtonElement>(null)
  const { auth } = useAuthStore()
  const {
    systemName,
    logo: systemLogo,
    loading,
    logoLoaded,
  } = useSystemConfig()
  const dynamicLinks = useTopNavLinks()
  const notifications = useNotifications()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const user = auth.user
  const isAuthenticated = !!user
  const displaySiteName = customSiteName || systemName
  const links = dynamicLinks.length > 0 ? dynamicLinks : navLinks

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    if (!mobileOpen) return

    const menu = mobileMenuRef.current
    const focusable = menu?.querySelectorAll<HTMLElement>(
      'a[href]:not([aria-disabled="true"]), button:not([disabled])'
    )
    focusable?.item(0).focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        mobileTriggerRef.current?.focus()
        return
      }
      if (event.key !== 'Tab' || !focusable?.length) return

      const first = focusable.item(0)
      const last = focusable.item(focusable.length - 1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  useEffect(() => {
    if (!authPromptTarget) return

    const intervalId = window.setInterval(() => {
      setAuthPromptSecondsLeft((seconds) => Math.max(seconds - 1, 0))
    }, 1000)

    const timeoutId = window.setTimeout(() => {
      const redirect = authPromptTarget.href
      setAuthPromptTarget(null)
      navigate({ to: '/sign-in', search: { redirect } })
    }, AUTH_PROMPT_SECONDS * 1000)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [authPromptTarget, navigate])

  const closeAuthPrompt = useCallback(() => {
    setAuthPromptTarget(null)
    setAuthPromptSecondsLeft(AUTH_PROMPT_SECONDS)
  }, [])

  const navigateToSignIn = useCallback(() => {
    const redirect = authPromptTarget?.href || '/'
    setAuthPromptTarget(null)
    navigate({ to: '/sign-in', search: { redirect } })
  }, [authPromptTarget?.href, navigate])

  const handleNavLinkClick = useCallback(
    (
      event: React.MouseEvent<HTMLAnchorElement>,
      link: TopNavLink,
      closeMobile = false
    ) => {
      if (link.disabled) {
        event.preventDefault()
        return
      }

      if (link.requiresAuth) {
        event.preventDefault()
        if (closeMobile) {
          setMobileOpen(false)
        }
        setAuthPromptSecondsLeft(AUTH_PROMPT_SECONDS)
        setAuthPromptTarget({
          title: t(link.title),
          href: link.href,
        })
        return
      }

      if (closeMobile) {
        setMobileOpen(false)
      }
    },
    [t]
  )

  let logoContent: React.ReactNode = (
    <HeaderLogo src={systemLogo} loading={loading} logoLoaded={logoLoaded} />
  )
  if (loading) {
    logoContent = <Skeleton className='size-full rounded-lg' />
  } else if (customLogo) {
    logoContent = customLogo
  }

  let authContent: React.ReactNode = (
    <div className='flex items-center gap-3'>
      <Link
        to='/sign-in'
        className='text-muted-foreground hover:text-foreground hidden text-sm whitespace-nowrap transition-colors sm:inline'
      >
        {t('Sign in')}
      </Link>
      <Button
        size='sm'
        className='h-8 px-3.5 font-medium'
        render={<Link to='/sign-up' />}
      >
        {t('Get Started')}
      </Button>
    </div>
  )
  if (loading) {
    authContent = <Skeleton className='h-8 w-28 rounded-md' />
  } else if (isAuthenticated) {
    authContent = (
      <Button
        size='sm'
        className='h-8 px-3.5 font-medium'
        render={<Link to='/dashboard' />}
      >
        {t('Go to Dashboard')}
      </Button>
    )
  }

  let mobileAuthHref = '/sign-up'
  let mobileAuthLabel = t('Get Started')
  if (isAuthenticated) {
    mobileAuthHref = '/dashboard'
    mobileAuthLabel = t('Go to Dashboard')
  }

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300',
          scrolled
            ? 'border-border/60 bg-background/80 backdrop-blur-lg'
            : 'border-border bg-background'
        )}
      >
        <nav className='mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6'>
          <Link
            to={homeUrl}
            className='inline-flex shrink-0 items-center gap-2 text-xl leading-none font-bold tracking-tight'
          >
            <span className='inline-flex size-[1em] shrink-0 items-center justify-center overflow-hidden rounded-[0.2em]'>
              {logoContent}
            </span>
            <span className='whitespace-nowrap'>
              {loading ? (
                <Skeleton className='h-[1em] w-28' />
              ) : (
                displaySiteName
              )}
            </span>
          </Link>

          <div className='hidden min-w-0 flex-1 items-center gap-1 sm:flex'>
            {links.map((link) => {
              const isActive = pathname === link.href
              const linkClassName = cn(
                'block px-3 py-2 text-sm whitespace-nowrap transition-colors duration-150',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-accent-foreground',
                link.disabled && 'pointer-events-none opacity-50'
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
                    onClick={(event) => handleNavLinkClick(event, link)}
                    className={linkClassName}
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
                  onClick={(event) => handleNavLinkClick(event, link)}
                  className={linkClassName}
                >
                  {t(link.title)}
                </Link>
              )
            })}
          </div>

          <div className='ms-auto hidden items-center gap-3 sm:flex'>
            {showLanguageSwitcher ? <LanguageSwitcher /> : null}
            <ThemeSwitch />
            {showNotifications ? (
              <NotificationPopover
                open={notifications.popoverOpen}
                onOpenChange={notifications.setPopoverOpen}
                unreadCount={notifications.unreadCount}
                activeTab={notifications.activeTab}
                onTabChange={notifications.setActiveTab}
                notice={notifications.notice}
                announcements={notifications.announcements}
                loading={notifications.loading}
              />
            ) : null}
            {showAuthButtons ? authContent : null}
          </div>

          {/* Mobile: compact actions + hamburger */}
          <div className='ms-auto flex items-center gap-2 sm:hidden'>
            <ThemeSwitch variant='menu' />
            {showAuthButtons && !loading && isAuthenticated && (
              <ProfileDropdown />
            )}
            <Button
              ref={mobileTriggerRef}
              type='button'
              variant='ghost'
              size='icon'
              className='size-9'
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={t('Toggle navigation menu')}
              aria-expanded={mobileOpen}
              aria-controls={MOBILE_MENU_ID}
            >
              <div className='relative size-4'>
                <span
                  className={cn(
                    'absolute inset-x-0 block h-[1.5px] origin-center rounded-full bg-current transition-all duration-300',
                    mobileOpen ? 'top-[7px] rotate-45' : 'top-[3px]'
                  )}
                />
                <span
                  className={cn(
                    'absolute inset-x-0 top-[7px] block h-[1.5px] rounded-full bg-current transition-all duration-300',
                    mobileOpen ? 'scale-x-0 opacity-0' : 'opacity-100'
                  )}
                />
                <span
                  className={cn(
                    'absolute inset-x-0 block h-[1.5px] origin-center rounded-full bg-current transition-all duration-300',
                    mobileOpen ? 'top-[7px] -rotate-45' : 'top-[11px]'
                  )}
                />
              </div>
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile full-screen overlay */}
      <div
        ref={mobileMenuRef}
        id={MOBILE_MENU_ID}
        role='dialog'
        aria-modal='true'
        aria-label={t('Toggle navigation menu')}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        className={cn(
          'bg-background fixed inset-0 z-40 transition-all duration-300 sm:pointer-events-none sm:hidden',
          mobileOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        )}
      >
        <div className='flex h-full flex-col justify-between px-8 pt-20 pb-10'>
          <nav className='flex flex-col gap-1'>
            {links.map((link, i) => {
              const isActive = pathname === link.href
              const linkClassName = cn(
                'flex items-center gap-3 py-3 text-base font-medium tracking-tight transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                mobileOpen
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0',
                isActive ? 'text-foreground' : 'text-muted-foreground',
                link.disabled && 'pointer-events-none opacity-50'
              )
              const transitionStyle = {
                transitionDelay: mobileOpen ? `${100 + i * 50}ms` : '0ms',
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
                    onClick={(event) => handleNavLinkClick(event, link, true)}
                    className={linkClassName}
                    style={transitionStyle}
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
                  onClick={(event) => handleNavLinkClick(event, link, true)}
                  className={linkClassName}
                  style={transitionStyle}
                >
                  {t(link.title)}
                </Link>
              )
            })}
          </nav>

          <div
            className={cn(
              'flex flex-col gap-3 transition-all duration-500',
              mobileOpen
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0'
            )}
            style={{ transitionDelay: mobileOpen ? '250ms' : '0ms' }}
          >
            <div className='border-border flex items-center justify-between border-b pb-3'>
              <span className='text-muted-foreground text-sm'>
                {t('Theme')}
              </span>
              <ThemeSwitch />
            </div>
            {showLanguageSwitcher && (
              <div className='border-border flex items-center justify-between border-b pb-3'>
                <span className='text-muted-foreground text-sm'>
                  {t('Change language')}
                </span>
                <LanguageSwitcher />
              </div>
            )}
            {showAuthButtons ? (
              <Link
                to={mobileAuthHref}
                onClick={() => setMobileOpen(false)}
                className='bg-foreground text-background inline-flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-opacity hover:opacity-90 active:opacity-80'
              >
                {mobileAuthLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog
        open={!!authPromptTarget}
        onOpenChange={(open) => {
          if (!open) {
            closeAuthPrompt()
          }
        }}
        title={t('Sign in required')}
        description={t('Please sign in to view {{module}}.', {
          module: authPromptTarget?.title || '',
        })}
        contentClassName='sm:max-w-md'
        contentHeight='auto'
        footer={
          <>
            <Button variant='outline' onClick={closeAuthPrompt}>
              {t('Cancel')}
            </Button>
            <Button onClick={navigateToSignIn}>{t('Sign in now')}</Button>
          </>
        }
      >
        <div className='bg-muted/40 text-muted-foreground rounded-lg px-3 py-2 text-sm'>
          {t('Redirecting to sign in in {{seconds}} seconds.', {
            seconds: authPromptSecondsLeft,
          })}
        </div>
      </Dialog>
    </>
  )
}
