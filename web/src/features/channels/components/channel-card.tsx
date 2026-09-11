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
import { flexRender, type Row } from '@tanstack/react-table'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { getLobeIcon } from '@/lib/lobe-icon'

import { getChannelTypeIcon, getChannelTypeLabel } from '../lib'
import type { Channel } from '../types'
import { ChannelRowActionsLayoutContext } from './channel-row-actions-context'

/**
 * Bespoke channel card aligned with the models page card layout.
 * Reuses column cell renderers via flexRender.
 */
function ChannelCardComponent({
  row,
  isSelected,
}: {
  row: Row<Channel>
  isSelected: boolean
}) {
  const { t } = useTranslation()
  const cells = row.getAllCells()

  const renderCell = (id: string) => {
    const cell = cells.find((c) => c.column.id === id)
    if (!cell || !cell.column.columnDef.cell) {
      return null
    }
    return flexRender(cell.column.columnDef.cell, cell.getContext())
  }

  const selectCell = renderCell('select')
  const nameCell = renderCell('name')
  const statusCell = renderCell('status')
  const actionsCell = renderCell('actions')
  const balanceCell = renderCell('balance')
  const responseCell = renderCell('response_time')
  const testCell = renderCell('test_time')

  const channelType = row.original.type
  const typeLabel = t(getChannelTypeLabel(channelType))
  const iconName = getChannelTypeIcon(channelType)
  const providerIcon = getLobeIcon(`${iconName}.Color`, 28)

  return (
    <ChannelRowActionsLayoutContext.Provider value='card'>
      <div
        data-state={isSelected ? 'selected' : undefined}
        className='flex h-full min-h-36 flex-col gap-3'
      >
        <div className='flex items-start gap-3'>
          <div className='bg-muted/50 ring-border/60 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1'>
            {providerIcon ?? (
              <span className='text-muted-foreground text-sm font-semibold'>
                {typeLabel.charAt(0)}
              </span>
            )}
          </div>

          <div className='min-w-0 flex-1'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0 flex-1'>
                {selectCell ? (
                  <div className='mb-1 flex items-center gap-2'>{selectCell}</div>
                ) : null}
                <div className='min-w-0 text-sm'>{nameCell}</div>
                <div className='text-muted-foreground/80 mt-1 truncate text-xs'>
                  {typeLabel}
                </div>
              </div>
              <div className='flex shrink-0 items-center gap-1'>{actionsCell}</div>
            </div>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>{statusCell}</div>

        <div className='border-border/60 text-muted-foreground mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3 text-xs'>
          <div className='min-w-0 space-y-1'>
            <div className='font-medium'>{t('Used / Remaining')}</div>
            <div className='text-foreground min-w-0 text-sm'>
              {balanceCell ?? <span className='text-muted-foreground'>-</span>}
            </div>
          </div>
          <div className='grid grid-cols-2 gap-x-3 gap-y-1'>
            <span className='font-medium'>{t('Response')}</span>
            <span className='font-medium'>{t('Last Tested')}</span>
            <div className='text-foreground text-sm'>
              {responseCell ?? <span className='text-muted-foreground'>-</span>}
            </div>
            <div className='text-foreground text-sm'>
              {testCell ?? <span className='text-muted-foreground'>-</span>}
            </div>
          </div>
        </div>
      </div>
    </ChannelRowActionsLayoutContext.Provider>
  )
}

export const ChannelCard = memo(ChannelCardComponent)
