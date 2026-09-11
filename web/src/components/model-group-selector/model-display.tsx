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
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

export type { ModelSelectorOption } from './model-display-label'
export {
  formatModelSelectorLabel,
  formatModelSelectorListLabel,
  formatModelSelectorTriggerLabel,
} from './model-display-label'

function isHttpIcon(icon?: string): icon is string {
  return Boolean(icon?.startsWith('http://') || icon?.startsWith('https://'))
}

export function ModelSelectorIcon({
  className,
  icon,
  label,
  size = 20,
}: {
  className?: string
  icon?: string
  label?: string
  size?: number
}) {
  if (isHttpIcon(icon)) {
    return (
      <img
        alt=''
        className={cn('shrink-0 rounded-sm object-contain', className)}
        height={size}
        src={icon}
        width={size}
      />
    )
  }

  if (icon?.trim()) {
    return (
      <span className={cn('inline-flex shrink-0 items-center', className)}>
        {getLobeIcon(icon, size)}
      </span>
    )
  }

  const initial = (label || '?').charAt(0).toUpperCase()
  return (
    <span
      className={cn(
        'bg-muted text-muted-foreground inline-flex shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
        className
      )}
      style={{ width: size, height: size }}
    >
      {initial}
    </span>
  )
}
