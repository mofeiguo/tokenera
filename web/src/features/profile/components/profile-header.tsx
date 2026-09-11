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

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { getUserAvatarFallback, getUserAvatarStyle } from '@/lib/avatar'
import { getRoleLabelKey } from '@/lib/roles'

import { getDisplayName } from '../lib'
import type { UserProfile } from '../types'

type ProfileHeaderProps = {
  loading: boolean
  profile: UserProfile | null
}

export function ProfileHeader(props: ProfileHeaderProps) {
  const { t } = useTranslation()
  if (props.loading) {
    return (
      <div className='mt-4 flex items-center gap-3'>
        <Skeleton className='size-9 rounded-full' />
        <div className='space-y-1.5'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-3.5 w-48' />
        </div>
      </div>
    )
  }

  if (!props.profile) return null

  const displayName = getDisplayName(props.profile)
  const avatarName = props.profile.username || displayName
  const details = [
    `@${props.profile.username}`,
    props.profile.email,
    t(getRoleLabelKey(props.profile.role)),
  ].filter(Boolean)

  return (
    <div className='mt-4 flex items-center gap-3'>
      <Avatar className='size-9'>
        <AvatarFallback
          className='text-[12px] font-semibold text-white'
          style={getUserAvatarStyle(avatarName)}
        >
          {getUserAvatarFallback(avatarName)}
        </AvatarFallback>
      </Avatar>
      <div className='min-w-0'>
        <div className='truncate text-[14px] font-medium text-[#333333] dark:text-foreground'>
          {displayName}
        </div>
        <div className='text-[#999999] truncate text-[13px]'>
          {details.join(' · ')}
        </div>
      </div>
    </div>
  )
}
