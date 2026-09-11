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
import type { TopNavLink } from '../types'
import { STUDIO_MENU_TITLE, STUDIO_NAV_ITEMS } from './studio-nav'

export type PublicNavEntry =
  | { kind: 'link'; link: TopNavLink }
  | { kind: 'menu'; title: string; links: TopNavLink[] }

const PRICING_HREF = '/pricing'
const RANKINGS_HREF = '/rankings'

function findLinkByHref(links: TopNavLink[], href: string) {
  return links.find((link) => link.href === href)
}

/**
 * Groups flat backend nav links into ZenMux-style center navigation entries.
 */
export function buildPublicNavEntries(links: TopNavLink[]): PublicNavEntry[] {
  const used = new Set<string>()
  const entries: PublicNavEntry[] = []

  const pushLink = (link: TopNavLink | undefined) => {
    if (!link || used.has(link.href)) return
    used.add(link.href)
    entries.push({ kind: 'link', link })
  }

  const studioLinks = STUDIO_NAV_ITEMS.map((item) =>
    findLinkByHref(links, item.href)
  ).filter((link): link is TopNavLink => Boolean(link))
  if (studioLinks.length > 0) {
    studioLinks.forEach((link) => used.add(link.href))
    entries.push({
      kind: 'menu',
      title: STUDIO_MENU_TITLE,
      links: studioLinks,
    })
  }

  pushLink(findLinkByHref(links, PRICING_HREF))
  pushLink(findLinkByHref(links, RANKINGS_HREF))

  for (const link of links) {
    if (link.href === '/docs' || (link.external && link.href.includes('doc'))) {
      pushLink(link)
    }
  }

  pushLink(findLinkByHref(links, '/about'))

  for (const link of links) {
    pushLink(link)
  }

  return entries
}
