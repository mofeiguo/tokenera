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
import {
  Activity,
  FileText,
  Image,
  Key,
  MessageSquare,
  Power,
  Receipt,
  Settings,
  Video,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { ROLE } from '@/lib/roles'

export type ProfileMenuItemConfig = {
  labelKey: string
  href: string
  icon: LucideIcon
  visibilityUrl: string
  requiredRole?: number
}

export type ProfileMenuSectionConfig = {
  items: ProfileMenuItemConfig[]
}

/** ZenMux-style profile menu sections mapped to TokenEra routes. */
export const PROFILE_MENU_SECTIONS: ProfileMenuSectionConfig[] = [
  {
    items: [
      {
        labelKey: 'Chat',
        href: '/studio/chat',
        icon: MessageSquare,
        visibilityUrl: '/studio/chat',
      },
      {
        labelKey: 'Image',
        href: '/studio/image',
        icon: Image,
        visibilityUrl: '/studio/chat',
      },
      {
        labelKey: 'Video',
        href: '/studio/video',
        icon: Video,
        visibilityUrl: '/studio/chat',
      },
    ],
  },
  {
    items: [
      {
        labelKey: 'Logs',
        href: '/analytics/logs',
        icon: FileText,
        visibilityUrl: '/analytics/logs',
      },
      {
        labelKey: 'Usage',
        href: '/analytics/usage',
        icon: Activity,
        visibilityUrl: '/analytics/usage',
      },
    ],
  },
  {
    items: [
      {
        labelKey: 'API Keys',
        href: '/keys',
        icon: Key,
        visibilityUrl: '/keys',
      },
      {
        labelKey: 'Billing',
        href: '/wallet',
        icon: Receipt,
        visibilityUrl: '/wallet',
      },
      {
        labelKey: 'Settings',
        href: '/profile',
        icon: Settings,
        visibilityUrl: '/profile',
      },
      {
        labelKey: 'System Settings',
        href: '/system-settings/site/system-info',
        icon: Settings,
        visibilityUrl: '/system-settings/site',
        requiredRole: ROLE.SUPER_ADMIN,
      },
    ],
  },
]

export const PROFILE_MENU_SIGN_OUT_ICON = Power
