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
import { useMemo } from 'react'

import {
  PROFILE_MENU_SECTIONS,
  type ProfileMenuItemConfig,
} from '@/components/profile-menu-config'
import { useIsSidebarModuleVisible } from '@/hooks/use-sidebar-config'
import { useAuthStore } from '@/stores/auth-store'

export type ProfileMenuSection = {
  items: ProfileMenuItemConfig[]
}

export function useProfileMenuSections(): ProfileMenuSection[] {
  const user = useAuthStore((state) => state.auth.user)
  const isStudioVisible = useIsSidebarModuleVisible('/studio/chat')
  const isLogsVisible = useIsSidebarModuleVisible('/analytics/logs')
  const isUsageVisible = useIsSidebarModuleVisible('/analytics/usage')
  const isWalletVisible = useIsSidebarModuleVisible('/wallet')
  const isKeysVisible = useIsSidebarModuleVisible('/keys')
  const isProfileVisible = useIsSidebarModuleVisible('/profile')
  const isSystemSettingsVisible = useIsSidebarModuleVisible('/system-settings/site')

  const visibilityByUrl = useMemo(
    () => ({
      '/studio/chat': isStudioVisible,
      '/analytics/logs': isLogsVisible,
      '/analytics/usage': isUsageVisible,
      '/wallet': isWalletVisible,
      '/keys': isKeysVisible,
      '/profile': isProfileVisible,
      '/system-settings/site': isSystemSettingsVisible,
    }),
    [
      isStudioVisible,
      isLogsVisible,
      isUsageVisible,
      isWalletVisible,
      isKeysVisible,
      isProfileVisible,
      isSystemSettingsVisible,
    ]
  )

  return useMemo(() => {
    return PROFILE_MENU_SECTIONS.map((section) => ({
      items: section.items.filter((item) => {
        if (item.requiredRole !== undefined && user?.role !== item.requiredRole) {
          return false
        }
        return visibilityByUrl[
          item.visibilityUrl as keyof typeof visibilityByUrl
        ]
      }),
    })).filter((section) => section.items.length > 0)
  }, [user?.role, visibilityByUrl])
}
