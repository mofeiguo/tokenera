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
import { describe, expect, test } from 'vitest'

import { buildPublicNavEntries } from '../public-nav-entries'

describe('buildPublicNavEntries', () => {
  test('groups studio links into a Chat / Image / Video menu', () => {
    const links = [
      { title: 'Chat', href: '/studio/chat' },
      { title: 'Image', href: '/studio/image' },
      { title: 'Video', href: '/studio/video' },
      { title: 'Model Square', href: '/pricing' },
      { title: 'Rankings', href: '/rankings' },
      { title: 'About', href: '/about' },
    ]

    const entries = buildPublicNavEntries(links)

    expect(entries).toEqual([
      {
        kind: 'menu',
        title: 'Studio',
        links: [links[0], links[1], links[2]],
      },
      { kind: 'link', link: links[3] },
      { kind: 'link', link: links[4] },
      { kind: 'link', link: links[5] },
    ])
  })

  test('keeps single pricing link flat when rankings is absent', () => {
    const links = [
      { title: 'Chat', href: '/studio/chat' },
      { title: 'Model Square', href: '/pricing' },
    ]

    const entries = buildPublicNavEntries(links)

    expect(entries).toEqual([
      {
        kind: 'menu',
        title: 'Studio',
        links: [links[0]],
      },
      { kind: 'link', link: links[1] },
    ])
  })
})
