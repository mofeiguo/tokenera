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
import { ChevronUp, CreditCard, LogOut, User } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { SignOutDialog } from '@/components/sign-out-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import useDialogState from '@/hooks/use-dialog'
import { useIsSidebarModuleVisible } from '@/hooks/use-sidebar-config'
import { useUserDisplay } from '@/hooks/use-user-display'
import { getUserAvatarFallback, getUserAvatarStyle } from '@/lib/avatar'
import { formatQuota } from '@/lib/format'
import { Link, useNavigate } from '@/lib/router'
import { useAuthStore } from '@/stores/auth-store'

export function SidebarUserMenu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isMobile, setOpenMobile } = useSidebar()
  const [open, setOpen] = useDialogState()
  const user = useAuthStore((state) => state.auth.user)
  const { displayName, secondaryText } = useUserDisplay(user)
  const isWalletVisible = useIsSidebarModuleVisible('/wallet')
  const remainQuota = Number(user?.quota ?? 0)
  const avatarName = user?.username || displayName
  const avatarFallback = getUserAvatarFallback(avatarName)
  const avatarFallbackStyle = useMemo(
    () => getUserAvatarStyle(avatarName),
    [avatarName]
  )

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <>
      {isWalletVisible ? (
        <div className='px-2 py-1.5 group-data-[collapsible=icon]:hidden'>
          <Link
            to='/wallet'
            onClick={closeMobile}
            className='hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-md p-2 text-left transition-colors'
          >
            <span className='flex items-center gap-2'>
              <CreditCard className='text-muted-foreground size-4' />
              <span className='flex flex-col'>
                <span className='text-sm font-medium'>{t('Wallet')}</span>
                <span className='text-muted-foreground text-xs'>
                  {formatQuota(remainQuota)}
                </span>
              </span>
            </span>
            <span className='text-muted-foreground text-xs'>{t('Add')}</span>
          </Link>
        </div>
      ) : null}

      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                />
              }
            >
              <Avatar className='size-8 rounded-lg'>
                <AvatarFallback
                  className='rounded-lg text-xs font-semibold text-white'
                  style={avatarFallbackStyle}
                >
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden'>
                <span className='truncate font-semibold'>{displayName}</span>
                <span className='text-muted-foreground truncate text-xs'>
                  {secondaryText}
                </span>
              </div>
              <ChevronUp className='ms-auto size-4 group-data-[collapsible=icon]:hidden' />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='min-w-56 rounded-lg'
              side='top'
              align='end'
              sideOffset={4}
            >
              <DropdownMenuItem
                onClick={() => {
                  closeMobile()
                  void navigate({ to: '/profile' })
                }}
              >
                <User className='size-4' />
                {t('Profile')}
              </DropdownMenuItem>
              {isWalletVisible ? (
                <DropdownMenuItem
                  onClick={() => {
                    closeMobile()
                    void navigate({ to: '/wallet' })
                  }}
                >
                  <CreditCard className='size-4' />
                  {t('Wallet')}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant='destructive'
                onClick={() => setOpen(true)}
              >
                <LogOut className='size-4' />
                {t('Sign out')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
