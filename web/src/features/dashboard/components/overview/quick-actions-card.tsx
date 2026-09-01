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
  BarChart3,
  FileText,
  FlaskConical,
  Key,
  RadioTower,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ROLE } from '@/lib/roles'
import { Link } from '@/lib/router'
import { useAuthStore } from '@/stores/auth-store'

type QuickAction = {
  to: string
  icon: LucideIcon
  label: string
  adminOnly?: boolean
}

export function QuickActionsCard(props: { className?: string }) {
  const { t } = useTranslation()
  const userRole = useAuthStore((state) => state.auth.user?.role)
  const isAdmin = Boolean(userRole && userRole >= ROLE.ADMIN)

  const actions = useMemo<QuickAction[]>(
    () => [
      { to: '/keys', icon: Key, label: t('API Keys') },
      {
        to: '/channels',
        icon: RadioTower,
        label: t('Channels'),
        adminOnly: true,
      },
      { to: '/usage-logs', icon: FileText, label: t('Usage Logs') },
      {
        to: '/dashboard/models',
        icon: BarChart3,
        label: t('Model Call Analytics'),
      },
      { to: '/playground', icon: FlaskConical, label: t('Playground') },
      { to: '/wallet', icon: Wallet, label: t('Wallet') },
    ],
    [t]
  )

  const visible = actions.filter((action) => !action.adminOnly || isAdmin)

  return (
    <Card className={props.className}>
      <CardHeader>
        <CardTitle>{t('Quick Actions')}</CardTitle>
        <CardDescription>{t('Jump straight to common tasks')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-2'>
          {visible.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.to}
                to={action.to}
                className='group border-border/60 hover:border-primary/40 hover:bg-accent/40 flex items-center gap-3 rounded-lg border p-3 transition-colors'
              >
                <span className='border-border/60 bg-muted/40 text-muted-foreground group-hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-md border transition-colors'>
                  <Icon className='size-4' />
                </span>
                <span className='text-sm leading-tight font-medium'>
                  {action.label}
                </span>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
