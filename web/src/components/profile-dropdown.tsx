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
import { ChevronsUpDown, LogOut, Settings, User, Wallet } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { PROFILE_MENU_SIGN_OUT_ICON } from '@/components/profile-menu-config'
import { SignOutDialog } from '@/components/sign-out-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useDialogState from '@/hooks/use-dialog'
import { useProfileMenuSections } from '@/hooks/use-profile-menu-sections'
import { useIsSidebarModuleVisible } from '@/hooks/use-sidebar-config'
import { useUserDisplay } from '@/hooks/use-user-display'
import { getUserAvatarFallback, getUserAvatarStyle } from '@/lib/avatar'
import { ROLE } from '@/lib/roles'
import { useNavigate } from '@/lib/router'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

const avatarFallbackClassName = 'font-semibold text-white'
const SignOutIcon = PROFILE_MENU_SIGN_OUT_ICON

const zenmuxMenuItemClassName =
  'h-10 gap-3 rounded-none px-4 text-[15px] font-normal focus:bg-muted/60'

type ProfileDropdownProps = {
  variant?: 'default' | 'toolbar'
}

export function ProfileDropdown({ variant = 'default' }: ProfileDropdownProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useDialogState()
  const user = useAuthStore((state) => state.auth.user)
  const { displayName } = useUserDisplay(user)
  const isSuperAdmin = user?.role === ROLE.SUPER_ADMIN
  const isWalletVisible = useIsSidebarModuleVisible('/wallet')
  const menuSections = useProfileMenuSections()
  const avatarName = user?.username || displayName
  const avatarFallback = getUserAvatarFallback(avatarName)
  const avatarFallbackStyle = useMemo(
    () => getUserAvatarStyle(avatarName),
    [avatarName]
  )

  const isToolbar = variant === 'toolbar'
  const avatarSize = isToolbar ? 'size-8' : 'size-6'
  const avatarTextSize = isToolbar ? 'text-xs' : 'text-[11px]'

  const trigger = isToolbar ? (
    <button
      type='button'
      aria-label={t('User Menu')}
      className='hover:bg-muted/80 dark:hover:bg-muted flex size-8 items-center justify-center rounded-lg border-0 bg-transparent p-0 transition-colors'
    />
  ) : (
    <Button variant='ghost' className='relative size-6 p-0' />
  )

  const navigateTo = (href: string) => {
    void navigate({ to: href })
  }

  const menuContent = isToolbar ? (
    <DropdownMenuContent
      align='end'
      sideOffset={8}
      className='w-[248px] overflow-hidden rounded-xl p-0 shadow-lg'
    >
      <div className='border-border/60 border-b px-4 py-3'>
        <div className='flex items-center gap-3'>
          <Avatar className='size-10'>
            <AvatarFallback
              className={`${avatarFallbackClassName} text-sm`}
              style={avatarFallbackStyle}
            >
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            <p className='text-foreground truncate text-[15px] leading-tight font-semibold'>
              {displayName}
            </p>
            <button
              type='button'
              onClick={() => navigateTo('/profile')}
              className='text-muted-foreground hover:text-foreground mt-0.5 inline-flex max-w-full items-center gap-1 text-sm transition-colors'
            >
              <span className='truncate'>{t('Personal')}</span>
              <ChevronsUpDown className='size-3.5 shrink-0 opacity-70' />
            </button>
          </div>
        </div>
      </div>

      <div className='py-1'>
        {menuSections.map((section, sectionIndex) => (
          <div key={section.items.map((item) => item.href).join('-')}>
            {sectionIndex > 0 ? (
              <DropdownMenuSeparator className='my-1' />
            ) : null}
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <DropdownMenuItem
                  key={`${item.href}-${item.labelKey}`}
                  className={zenmuxMenuItemClassName}
                  onClick={() => navigateTo(item.href)}
                >
                  <Icon className='text-foreground size-[18px] stroke-[1.5]' />
                  {t(item.labelKey)}
                </DropdownMenuItem>
              )
            })}
          </div>
        ))}
      </div>

      <DropdownMenuSeparator className='my-0' />

      <div className='py-1'>
        <DropdownMenuItem
          className={cn(zenmuxMenuItemClassName, 'text-foreground')}
          onClick={() => setOpen(true)}
        >
          <SignOutIcon className='size-[18px] stroke-[1.5]' />
          {t('Sign out')}
        </DropdownMenuItem>
      </div>
    </DropdownMenuContent>
  ) : (
    <DropdownMenuContent align='end' sideOffset={8} className='w-56'>
      <div className='flex items-center gap-2 px-1.5 py-1.5'>
        <Avatar className='size-8'>
          <AvatarFallback
            className={`${avatarFallbackClassName} text-xs`}
            style={avatarFallbackStyle}
          >
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-col gap-0.5 overflow-hidden'>
          <p className='text-foreground truncate text-sm font-medium'>
            {displayName}
          </p>
          <span className='text-muted-foreground truncate text-xs'>
            {t('Personal')}
          </span>
        </div>
      </div>

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={() => navigateTo('/profile')}>
        <User className='size-4' />
        {t('Profile')}
      </DropdownMenuItem>

      {isWalletVisible ? (
        <DropdownMenuItem onClick={() => navigateTo('/wallet')}>
          <Wallet className='size-4' />
          {t('Wallet')}
        </DropdownMenuItem>
      ) : null}

      {isSuperAdmin ? (
        <DropdownMenuItem
          onClick={() =>
            navigate({
              to: '/system-settings/site/$section',
              params: { section: 'system-info' },
            })
          }
        >
          <Settings className='size-4' />
          {t('System Settings')}
        </DropdownMenuItem>
      ) : null}

      <DropdownMenuSeparator />

      <DropdownMenuItem variant='destructive' onClick={() => setOpen(true)}>
        <LogOut className='size-4' />
        {t('Sign out')}
      </DropdownMenuItem>
    </DropdownMenuContent>
  )

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger render={trigger}>
          <Avatar className={avatarSize}>
            <AvatarFallback
              className={`${avatarFallbackClassName} ${avatarTextSize}`}
              style={avatarFallbackStyle}
            >
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        {menuContent}
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
