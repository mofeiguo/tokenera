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
import { Eye, Grid2X2, MessageSquare, Table2, Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import {
  MODEL_INTENTS,
  CAPABILITY_FILTERS,
  VIEW_MODES,
  getCapabilityFilterLabels,
  getModelIntentLabels,
  type CapabilityFilter,
  type ModelIntent,
  type ViewMode,
} from '../constants'
import { SearchBar } from './search-bar'

const CAPABILITY_FILTER_ICONS = {
  [CAPABILITY_FILTERS.VISION]: { icon: Eye, color: 'text-green-500' },
  [CAPABILITY_FILTERS.TOOLS]: { icon: Wrench, color: 'text-purple-500' },
  [CAPABILITY_FILTERS.REASONING]: {
    icon: MessageSquare,
    color: 'text-orange-500',
  },
} as const

export interface CatalogToolbarProps {
  searchInput: string
  onSearchChange: (value: string) => void
  onClearSearch: () => void
  modelIntent: ModelIntent
  onModelIntentChange: (value: ModelIntent) => void
  capabilityFilter: CapabilityFilter
  onCapabilityFilterChange: (value: CapabilityFilter) => void
  filteredCount: number
  totalCount: number
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
}

export function CatalogToolbar(props: CatalogToolbarProps) {
  const { t } = useTranslation()
  const intentLabels = getModelIntentLabels(t)
  const capabilityLabels = getCapabilityFilterLabels(t)

  return (
    <div>
      <SearchBar
        value={props.searchInput}
        onChange={props.onSearchChange}
        onClear={props.onClearSearch}
        placeholder={t('Search models or providers...')}
        className='w-full'
      />

      <div className='bg-background/95 supports-[backdrop-filter]:bg-background/80 border-border/60 sticky top-16 z-20 -mx-4 mt-5 border-y px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 xl:-mx-8 xl:px-8'>
        <div className='mx-auto flex max-w-[1800px] items-center justify-between gap-3'>
          <div
            className='hover-scrollbar -my-1 flex min-w-0 items-center gap-1 overflow-x-auto py-1'
            role='navigation'
            aria-label={t('Model categories')}
          >
            {Object.values(MODEL_INTENTS).map((intent) => {
              const isActive = props.modelIntent === intent
              return (
                <button
                  key={intent}
                  type='button'
                  onClick={() => props.onModelIntentChange(intent)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'focus-visible:ring-ring/40 h-8 shrink-0 rounded-md px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98]',
                    isActive
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  {intentLabels[intent]}
                </button>
              )
            })}
          </div>

          <div className='flex shrink-0 items-center gap-2'>
            <span className='text-muted-foreground/80 hidden text-xs tabular-nums md:inline'>
              {props.filteredCount.toLocaleString()} /{' '}
              {props.totalCount.toLocaleString()}
            </span>
            <div
              role='group'
              aria-label={t('View mode')}
              className='bg-muted/50 border-border/60 inline-flex h-8 items-center rounded-md border p-0.5'
            >
              <button
                type='button'
                onClick={() => props.onViewModeChange(VIEW_MODES.CARD)}
                aria-pressed={props.viewMode === VIEW_MODES.CARD}
                aria-label={t('Card view')}
                className={cn(
                  'inline-flex size-7 items-center justify-center rounded-sm transition-colors',
                  props.viewMode === VIEW_MODES.CARD
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Grid2X2 className='size-3.5' />
              </button>
              <button
                type='button'
                onClick={() => props.onViewModeChange(VIEW_MODES.TABLE)}
                aria-pressed={props.viewMode === VIEW_MODES.TABLE}
                aria-label={t('Table view')}
                className={cn(
                  'inline-flex size-7 items-center justify-center rounded-sm transition-colors',
                  props.viewMode === VIEW_MODES.TABLE
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Table2 className='size-3.5' />
              </button>
            </div>
          </div>
        </div>
        <div
          className='mx-auto mt-2 flex max-w-[1800px] items-center gap-1 overflow-x-auto'
          role='group'
          aria-label={t('Model capabilities')}
        >
          {Object.values(CAPABILITY_FILTERS).map((capability) => {
            const isActive = props.capabilityFilter === capability
            const filterStyle =
              capability === CAPABILITY_FILTERS.ALL
                ? null
                : CAPABILITY_FILTER_ICONS[capability]
            const FilterIcon = filterStyle?.icon
            return (
              <button
                key={capability}
                type='button'
                onClick={() => props.onCapabilityFilterChange(capability)}
                aria-pressed={isActive}
                className={cn(
                  'focus-visible:ring-ring/40 inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                  isActive
                    ? 'border-foreground/20 bg-foreground text-background'
                    : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                {filterStyle && FilterIcon ? (
                  <FilterIcon
                    className={cn(
                      'size-3.5',
                      isActive ? 'text-background' : filterStyle.color
                    )}
                  />
                ) : null}
                {capabilityLabels[capability]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
