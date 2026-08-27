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
import { PackageOpen, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export interface EmptyStateProps {
  searchQuery?: string
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function EmptyState(props: EmptyStateProps) {
  const { t } = useTranslation()
  const hasSearch = Boolean(props.searchQuery?.trim())
  const hasCriteria = props.hasActiveFilters || hasSearch
  let description = t('No models available')
  if (hasSearch) {
    description = t(
      'No results for "{{query}}". Try adjusting your search or filters.',
      { query: props.searchQuery }
    )
  } else if (hasCriteria) {
    description = t('No models match your current filters.')
  }

  return (
    <Empty className='bg-card/60 border-border/60 min-h-[360px] rounded-xl border border-dashed shadow-xs'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          {hasCriteria ? <SearchX /> : <PackageOpen />}
        </EmptyMedia>
        <EmptyTitle className='tracking-tight'>
          {hasCriteria ? t('No models found') : t('No models available')}
        </EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>

      {hasCriteria && (
        <EmptyContent>
          <Button variant='outline' size='sm' onClick={props.onClearFilters}>
            {t('Clear all filters')}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}
