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
export const STUDIO_MENU_TITLE = 'Studio'

export const STUDIO_NAV_PATHS = [
  '/studio/chat',
  '/studio/image',
  '/studio/video',
] as const

export type StudioNavPath = (typeof STUDIO_NAV_PATHS)[number]

export const STUDIO_NAV_ITEMS = [
  { titleKey: 'Chat', href: '/studio/chat' },
  { titleKey: 'Image', href: '/studio/image' },
  { titleKey: 'Video', href: '/studio/video' },
] as const satisfies ReadonlyArray<{
  titleKey: string
  href: StudioNavPath
}>
