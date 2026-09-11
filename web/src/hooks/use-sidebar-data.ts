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
  BarChart3,
  Box,
  CircleDollarSign,
  CreditCard,
  FileText,
  GitBranch,
  Image,
  Key,
  ListTodo,
  MessageSquare,
  Radio,
  ScrollText,
  ServerCog,
  Settings,
  Ticket,
  Users,
  Video,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { SidebarData } from '@/components/layout/types'
import { STUDIO_NAV_ITEMS } from '@/components/layout/lib/studio-nav'
import { ANALYTICS_NAV_ITEMS } from '@/features/analytics/nav'
import { ROLE } from '@/lib/roles'

/**
 * Root navigation groups for the application sidebar.
 *
 * These are shown when the URL does not match any nested sidebar view
 * registered in `layout/lib/sidebar-view-registry.ts`.
 */
export function useSidebarData(): SidebarData {
  const { t } = useTranslation()
  const studioIcons = {
    Chat: MessageSquare,
    Image,
    Video,
  } as const
  const analysisIcons = {
    Logs: ScrollText,
    Cost: CircleDollarSign,
    Usage: Activity,
  } as const

  return {
    navGroups: [
      {
        id: 'studio',
        title: t('Studio'),
        items: STUDIO_NAV_ITEMS.map((item) => ({
          title: t(item.titleKey),
          url: item.href,
          icon: studioIcons[item.titleKey],
          activeUrls: item.href === '/studio/chat' ? ['/playground'] : undefined,
        })),
      },
      {
        id: 'analysis',
        title: t('Analysis'),
        items: [
          ...ANALYTICS_NAV_ITEMS.map((item) => ({
            title: t(item.titleKey),
            url: item.url,
            icon: analysisIcons[item.titleKey],
          })),
          {
            title: t('Task'),
            url: '/usage-logs/task',
            icon: ListTodo,
          },
        ],
      },
      {
        id: 'management',
        title: t('Management'),
        items: [
          {
            title: t('API Keys'),
            url: '/keys',
            icon: Key,
          },
          {
            title: t('Wallet'),
            url: '/wallet',
            icon: Wallet,
          },
          {
            title: t('Settings'),
            url: '/profile',
            icon: Settings,
          },
          {
            title: t('Channels'),
            url: '/channels',
            icon: Radio,
            requiredRole: ROLE.ADMIN,
          },
          {
            title: t('Models'),
            url: '/models/metadata',
            icon: Box,
            requiredRole: ROLE.ADMIN,
          },
          {
            title: t('Users'),
            url: '/users',
            icon: Users,
            requiredRole: ROLE.ADMIN,
          },
          {
            title: t('Usage Logs'),
            url: '/usage-logs/common',
            icon: FileText,
            requiredRole: ROLE.ADMIN,
          },
          {
            title: t('Flow'),
            url: '/dashboard/flow',
            icon: GitBranch,
            requiredRole: ROLE.ADMIN,
          },
          {
            title: t('User Analytics'),
            url: '/dashboard/users',
            icon: BarChart3,
            requiredRole: ROLE.ADMIN,
          },
          {
            title: t('Redemption Codes'),
            url: '/redemption-codes',
            icon: Ticket,
            requiredRole: ROLE.ADMIN,
          },
          {
            title: t('Subscriptions'),
            url: '/subscriptions',
            icon: CreditCard,
            requiredRole: ROLE.ADMIN,
          },
          {
            title: t('System Info'),
            url: '/system-info',
            icon: ServerCog,
            requiredRole: ROLE.SUPER_ADMIN,
          },
          {
            title: t('System Settings'),
            url: '/system-settings/site',
            activeUrls: ['/system-settings'],
            icon: Settings,
            requiredRole: ROLE.ADMIN,
          },
        ],
      },
    ],
  }
}
