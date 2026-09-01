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
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationPopover } from '@/components/notification-popover'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Separator } from '@/components/ui/separator'
import { useNotifications } from '@/hooks/use-notifications'

import { Header } from './header'

type AppHeaderProps = {
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
  showNotifications?: boolean
}

export function AppHeader(props: AppHeaderProps) {
  const showNotifications = props.showNotifications ?? true
  const notifications = useNotifications()

  return (
    <Header>
      <Separator orientation='vertical' className='mr-2 hidden h-4 md:block' />
      {props.leftContent ? (
        <div className='flex items-center'>{props.leftContent}</div>
      ) : null}
      {props.rightContent ?? (
        <div className='ms-auto flex items-center gap-2'>
          <Search className='hidden sm:inline-flex' />
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
          <LanguageSwitcher />
          <ThemeSwitch size='compact' className='hidden md:inline-flex' />
          <ThemeSwitch variant='menu' className='md:hidden' />
        </div>
      )}
    </Header>
  )
}
