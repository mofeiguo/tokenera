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
  Activity01Icon,
  Add01Icon,
  ArrowDown01Icon,
  BoxesIcon,
  CheckListIcon,
  Copy01Icon,
  Delete02Icon,
  DollarCircleIcon,
  Download01Icon,
  EyeClosedIcon,
  EyeIcon,
  Key01Icon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  PowerIcon,
  PowerOffIcon,
  ServerStack01Icon,
  Settings02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

type ChannelIconProps = {
  className?: string
}

function channelIcon(
  icon: ComponentProps<typeof HugeiconsIcon>['icon'],
  className?: string
) {
  return (
    <HugeiconsIcon
      icon={icon}
      strokeWidth={2}
      className={cn('size-4 shrink-0', className)}
    />
  )
}

export function ChannelIconAdd(props: ChannelIconProps) {
  return channelIcon(Add01Icon, props.className)
}

export function ChannelIconMore(props: ChannelIconProps) {
  return channelIcon(MoreHorizontalIcon, props.className)
}

export function ChannelIconEdit(props: ChannelIconProps) {
  return channelIcon(PencilEdit02Icon, props.className)
}

export function ChannelIconTest(props: ChannelIconProps) {
  return channelIcon(Activity01Icon, props.className)
}

export function ChannelIconPowerOn(props: ChannelIconProps) {
  return channelIcon(PowerIcon, props.className)
}

export function ChannelIconPowerOff(props: ChannelIconProps) {
  return channelIcon(PowerOffIcon, props.className)
}

export function ChannelIconDelete(props: ChannelIconProps) {
  return channelIcon(Delete02Icon, props.className)
}

export function ChannelIconBalance(props: ChannelIconProps) {
  return channelIcon(DollarCircleIcon, props.className)
}

export function ChannelIconDownload(props: ChannelIconProps) {
  return channelIcon(Download01Icon, props.className)
}

export function ChannelIconCopy(props: ChannelIconProps) {
  return channelIcon(Copy01Icon, props.className)
}

export function ChannelIconKey(props: ChannelIconProps) {
  return channelIcon(Key01Icon, props.className)
}

export function ChannelIconChevronDown(props: ChannelIconProps) {
  return channelIcon(ArrowDown01Icon, props.className)
}

export function ChannelIconBatch(props: ChannelIconProps) {
  return channelIcon(CheckListIcon, props.className)
}

export function ChannelIconEye(props: ChannelIconProps) {
  return channelIcon(EyeIcon, props.className)
}

export function ChannelIconEyeOff(props: ChannelIconProps) {
  return channelIcon(EyeClosedIcon, props.className)
}

export function ChannelIconSettings(props: ChannelIconProps) {
  return channelIcon(Settings02Icon, props.className)
}

export function ChannelIconServer(props: ChannelIconProps) {
  return channelIcon(ServerStack01Icon, props.className)
}

export function ChannelIconModels(props: ChannelIconProps) {
  return channelIcon(BoxesIcon, props.className)
}
