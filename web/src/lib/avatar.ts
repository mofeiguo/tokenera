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
import type { CSSProperties } from 'react'

export type UserAvatarStyle = Pick<CSSProperties, 'backgroundColor' | 'color'>

/** Soft, ZenMux-inspired avatar backgrounds (stable per username). */
const USER_AVATAR_PALETTE = [
  'hsl(168, 52%, 40%)', // teal
  'hsl(191, 55%, 42%)', // cyan
  'hsl(205, 58%, 46%)', // steel blue
  'hsl(224, 50%, 54%)', // indigo
  'hsl(259, 46%, 56%)', // violet
  'hsl(340, 48%, 52%)', // rose
  'hsl(24, 58%, 50%)', // coral
  'hsl(152, 42%, 40%)', // sage
] as const

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

export function getUserAvatarStyle(name: string): UserAvatarStyle {
  const hash = hashString(name.trim().toLowerCase() || '?')
  const backgroundColor =
    USER_AVATAR_PALETTE[hash % USER_AVATAR_PALETTE.length]

  return {
    backgroundColor,
    color: 'white',
  }
}

export function getUserAvatarFallback(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}
