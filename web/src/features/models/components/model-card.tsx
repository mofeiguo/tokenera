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

import { CopyButton } from '@/components/copy-button'
import { cn } from '@/lib/utils'

import { formatModelTokenCount } from '../lib/model-capabilities'
import type { Model } from '../types'
import { ModelCapabilityChips } from './model-capability-chips'

function ModelCardComponent({
  row,
  isSelected,
}: {
  row: Row<Model>
  isSelected: boolean
}) {
  const { t } = useTranslation()
  const model = row.original
  const cells = row.getAllCells()
  const contextLength = formatModelTokenCount(model.context_length)
  const maxOutput = formatModelTokenCount(model.max_output_tokens)

  const renderCell = (id: string) => {
    const cell = cells.find((c) => c.column.id === id)
    if (!cell || !cell.column.columnDef.cell) {
      return null
    }
    return flexRender(cell.column.columnDef.cell, cell.getContext())
  }

  const selectCell = renderCell('select')
  const nameCell = renderCell('model_name')
  const statusCell = renderCell('status')
  const vendorCell = renderCell('vendor_id')
  const bindingsCell = renderCell('bound_channels')
  const actionsCell = renderCell('actions')
  const description = model.description?.trim()

  return (
    <div
      data-state={isSelected ? 'selected' : undefined}
      className='flex flex-col gap-3'
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='flex min-w-0 flex-1 items-start gap-2'>
          {selectCell ? (
            <span className='mt-0.5 shrink-0'>{selectCell}</span>
          ) : null}
          <div className='min-w-0 flex-1'>
            <div className='flex min-w-0 items-center gap-1.5'>
              <div className='min-w-0 flex-1 overflow-hidden'>{nameCell}</div>
              <CopyButton
                value={model.model_name}
                size='icon'
                className='size-7'
                tooltip={t('Copy model name')}
              />
            </div>
            {description ? (
              <p className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <div className='flex shrink-0 items-center gap-1.5'>
          {statusCell}
          {actionsCell}
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        {vendorCell}
        <ModelCapabilityChips model={model} />
      </div>

      <div className='text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-2 text-xs'>
        <div>
          <div className='font-medium'>{t('Bound Channels')}</div>
          <div className='text-foreground mt-0.5 text-sm'>{bindingsCell}</div>
        </div>
        <div>
          <div className='font-medium'>{t('Context')}</div>
          <div
            className={cn(
              'mt-0.5 text-sm tabular-nums',
              contextLength ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {contextLength || '—'}
          </div>
        </div>
        {maxOutput ? (
          <div>
            <div className='font-medium'>{t('Max output')}</div>
            <div className='text-foreground mt-0.5 text-sm tabular-nums'>
              {maxOutput}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export const ModelCard = memo(ModelCardComponent)
