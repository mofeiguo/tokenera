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
import { SearchIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useSearch } from '@/context/search-provider'
import { cn } from '@/lib/utils'

type SearchProps = {
  className?: string
  placeholder?: string
}

export function Search(props: SearchProps) {
  const { t } = useTranslation()
  const { setOpen } = useSearch()
  const resolvedPlaceholder = props.placeholder ?? t('Search')

  return (
    <button
      type='button'
      className={cn(
        'border-border bg-background/60 text-muted-foreground hover:bg-background focus-visible:ring-ring inline-flex h-8 w-[140px] items-center gap-2 rounded-full border px-3 text-xs shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none xl:w-[160px]',
        props.className
      )}
      onClick={() => setOpen(true)}
      aria-label={resolvedPlaceholder}
    >
      <SearchIcon aria-hidden='true' className='size-3.5 shrink-0' />
      <span className='min-w-0 flex-1 truncate text-start'>
        {resolvedPlaceholder}
      </span>
      <kbd className='border-border bg-muted text-muted-foreground ml-auto hidden rounded border px-1.5 py-0.5 font-sans text-[10px] font-medium sm:inline-flex'>
        ⌘{t('K')}
      </kbd>
    </button>
  )
}
