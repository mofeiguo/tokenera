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

import { IconGithub } from '@/assets/brand-icons'
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
import { Link, useNavigate } from '@/lib/router'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/auth-store'

import { defaultTopNavLinks } from '../config/top-nav.config'
import type { TopNavLink } from '../types'
import { PublicBrandMark } from './public-brand-mark'
import { PublicHeaderMenuIcon } from './public-header-menu-icon'
import { PublicHeaderMobileNav, PublicHeaderNav } from './public-header-nav'
import { PublicHeaderSearch } from './public-header-search'
import { SystemBrand } from './system-brand'
import { PUBLIC_BRAND_NAME } from './token-era-logo'

const DEFAULT_GITHUB_URL = 'https://github.com/QuantumNous/new-api'

const AUTH_PROMPT_SECONDS = 5
const MOBILE_MENU_ID = 'public-mobile-navigation'

type AuthPromptTarget = {
  title: string
  href: string
}

export interface PublicHeaderProps {
  /** Public pages use full brand + mobile nav; platform spans a complete top bar. */
  variant?: 'public' | 'platform'
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
  showSearch?: boolean
  showGithubLink?: boolean
  githubUrl?: string
  className?: string
}

function PlatformSidebarMenuButton() {
  const { toggleSidebar } = useSidebar()
  const { t } = useTranslation()

  return (
    <button
      type='button'
      aria-label={t('Toggle sidebar')}
      className='flex size-6 items-center justify-center border-0 bg-transparent p-0'
      onClick={toggleSidebar}
    >
      <PublicHeaderMenuIcon className='text-foreground size-6' />
    </button>
  )
}

export function PublicHeader(props: PublicHeaderProps) {
  const {
    variant = 'public',
    navLinks = defaultTopNavLinks,
    showLanguageSwitcher = true,
    logo: customLogo,
    siteName: customSiteName,
    homeUrl = '/',
    showAuthButtons = true,
    showNotifications = true,
    showSearch = true,
    showGithubLink = true,
    githubUrl = DEFAULT_GITHUB_URL,
  } = props

  const isPlatform = variant === 'platform'

  const { t } = useTranslation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authPromptTarget, setAuthPromptTarget] =
    useState<AuthPromptTarget | null>(null)
  const [authPromptSecondsLeft, setAuthPromptSecondsLeft] =
    useState(AUTH_PROMPT_SECONDS)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileTriggerRef = useRef<HTMLButtonElement>(null)
  const { auth } = useAuthStore()
  const { loading } = useSystemConfig()
  const dynamicLinks = useTopNavLinks()
  const notifications = useNotifications()

  const user = auth.user
  const isAuthenticated = !!user
  const links = dynamicLinks.length > 0 ? dynamicLinks : navLinks

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

      if (link.requiresAuth && !isPlatform && !isAuthenticated) {
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
    [isAuthenticated, isPlatform, t]
  )

  const brandContent = (
    <PublicBrandMark logo={customLogo} siteName={customSiteName} />
  )

  let authContent: React.ReactNode = (
    <Link
      to='/sign-in'
      className='flex h-[34px] min-w-[74px] items-center justify-center rounded-lg bg-black px-4 text-sm leading-none font-bold text-white transition-opacity hover:opacity-90'
    >
      {t('Sign in')}
    </Link>
  )
  if (loading) {
    authContent = <Skeleton className='h-[34px] w-[74px] rounded-lg' />
  } else if (isAuthenticated) {
    authContent = <ProfileDropdown variant='toolbar' />
  }

  return (
    <>
      <header
        className={cn(
          'z-50 w-full shrink-0 border-b border-border/80',
          isPlatform
            ? 'bg-background sticky top-0'
            : 'bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 top-0 backdrop-blur',
          props.className
        )}
      >
        <nav className='flex h-14 w-full items-center justify-between px-4 md:px-5'>
          <div className='relative z-20 flex flex-row items-center gap-3'>
            <div className='flex md:hidden'>
              {isPlatform ? (
                <PlatformSidebarMenuButton />
              ) : (
                <button
                  ref={mobileTriggerRef}
                  type='button'
                  aria-label={t('Open navigation')}
                  aria-expanded={mobileOpen}
                  aria-controls={MOBILE_MENU_ID}
                  className='flex size-6 items-center justify-center border-0 bg-transparent p-0'
                  onClick={() => setMobileOpen((value) => !value)}
                >
                  <PublicHeaderMenuIcon className='text-foreground size-6' />
                </button>
              )}
            </div>
            {isPlatform ? (
              <SystemBrand
                variant='inline'
                defaultName={PUBLIC_BRAND_NAME}
                to={homeUrl}
              />
            ) : (
              <Link to={homeUrl} className='inline-flex shrink-0 items-center'>
                {brandContent}
              </Link>
            )}
          </div>

          <div className='relative z-20 mr-[18px] ml-auto flex items-center gap-4'>
            <div className='hidden pr-9 md:flex'>
              <PublicHeaderNav links={links} onLinkClick={handleNavLinkClick} />
            </div>

            {showSearch ? <PublicHeaderSearch /> : null}

            {showGithubLink ? (
              <a
                href={githubUrl}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={t('GitHub')}
                className='text-muted-foreground hover:text-foreground hover:bg-muted/80 dark:hover:bg-muted hidden size-8 items-center justify-center rounded-lg transition-colors md:flex'
              >
                <IconGithub className='size-[18px]' aria-hidden />
              </a>
            ) : null}

            <div className='hidden md:flex'>
              <ThemeSwitch variant='toolbar' />
            </div>

            {showLanguageSwitcher ? (
              <div className='hidden md:flex'>
                <LanguageSwitcher icon='globe' />
              </div>
            ) : null}

            {showNotifications && isAuthenticated ? (
              <div className='hidden md:flex'>
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
              </div>
            ) : null}

            <div className='hidden md:flex'>{showAuthButtons ? authContent : null}</div>

            <div className='flex items-center gap-2 md:hidden'>
              {showAuthButtons && !loading && isAuthenticated && (
                <ProfileDropdown variant='toolbar' />
              )}
              {!loading && !isAuthenticated && showAuthButtons ? (
                <Link
                  to='/sign-in'
                  className='flex h-[34px] min-w-[74px] items-center justify-center rounded-lg bg-black px-3 text-sm font-bold text-white'
                >
                  {t('Sign in')}
                </Link>
              ) : null}
            </div>
          </div>
        </nav>
      </header>

      {!isPlatform ? (
        <div
          ref={mobileMenuRef}
          id={MOBILE_MENU_ID}
          role='dialog'
          aria-modal='true'
          aria-label={t('Toggle navigation menu')}
          aria-hidden={!mobileOpen}
          inert={!mobileOpen}
          className={cn(
            'bg-background fixed inset-0 z-40 transition-all duration-300 md:pointer-events-none md:hidden',
            mobileOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          )}
        >
          <div className='flex h-full flex-col justify-between px-8 pt-20 pb-10'>
            <PublicHeaderMobileNav
              links={links}
              onLinkClick={handleNavLinkClick}
              menuItemClassName={cn(
                mobileOpen
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              )}
            />

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
              {showGithubLink ? (
                <a
                  href={githubUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-muted-foreground hover:text-foreground inline-flex h-10 items-center gap-2 text-sm transition-colors'
                >
                  <IconGithub className='size-4' aria-hidden />
                  {t('GitHub')}
                </a>
              ) : null}
              {showAuthButtons && !isAuthenticated ? (
                <Link
                  to='/sign-in'
                  onClick={() => setMobileOpen(false)}
                  className='inline-flex h-[34px] min-w-[74px] items-center justify-center rounded-lg bg-black text-sm font-bold text-white transition-opacity hover:opacity-90'
                >
                  {t('Sign in')}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

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
