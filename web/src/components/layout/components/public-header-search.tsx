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
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useNavigate } from '@/lib/router'
import { cn } from '@/lib/utils'

function SearchGlyph(props: { className?: string }) {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden
      className={props.className}
    >
      <path
        d='M10.6667 10.6667L14 14M12 7C12 9.76142 9.76142 12 7 12C4.23858 12 2 9.76142 2 7C2 4.23858 4.23858 2 7 2C9.76142 2 12 4.23858 12 7Z'
        stroke='currentColor'
        strokeWidth='1.33333'
        strokeLinecap='round'
      />
    </svg>
  )
}

export function PublicHeaderSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus()
    }
  }, [expanded])

  useEffect(() => {
    if (!expanded) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setExpanded(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [expanded])

  const submitSearch = () => {
    const trimmed = query.trim()
    navigate({
      to: '/pricing',
      search: trimmed ? { search: trimmed } : {},
    })
    setExpanded(false)
  }

  return (
    <div
      ref={rootRef}
      className='text-muted-foreground hover:text-foreground hidden h-10 cursor-pointer items-center rounded-lg md:flex'
    >
      <button
        type='button'
        className='flex h-10 items-center justify-center px-1'
        aria-label={t('Search')}
        onClick={() => setExpanded(true)}
      >
        <SearchGlyph />
      </button>
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            submitSearch()
          }
          if (event.key === 'Escape') {
            setExpanded(false)
          }
        }}
        placeholder={t('Search')}
        aria-label={t('Search')}
        className={cn(
          'placeholder:text-muted-foreground/80 border-transparent bg-transparent text-sm outline-none transition-all duration-300 ease-in-out',
          expanded ? 'ml-1 w-28 opacity-100' : 'pointer-events-none w-0 opacity-0'
        )}
      />
    </div>
  )
}
