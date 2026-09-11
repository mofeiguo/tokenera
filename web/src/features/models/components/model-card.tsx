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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getLobeIcon } from '@/lib/lobe-icon'

import { formatModelTokenCount } from '../lib/model-capabilities'
import type { Model, Vendor } from '../types'
import { BoundChannelsCell } from './bound-channels-cell'
import { ModelCapabilityChips } from './model-capability-chips'
import { ModelRowActionsLayoutContext } from './model-row-actions-context'

type ModelCardProps = {
  row: Row<Model>
  vendor?: Vendor
}

function ModelCardComponent(props: ModelCardProps) {
  const { t } = useTranslation()
  const model = props.row.original
  const cells = props.row.getAllCells()

  const renderCell = (id: string) => {
    const cell = cells.find((c) => c.column.id === id)
    if (!cell || !cell.column.columnDef.cell) {
      return null
    }
    return flexRender(cell.column.columnDef.cell, cell.getContext())
  }

  const actionsCell = renderCell('actions')

  const contextLength = formatModelTokenCount(model.context_length)
  const maxOutput = formatModelTokenCount(model.max_output_tokens)
  const description = model.description?.trim()

  const vendorIcon = props.vendor?.icon
    ? getLobeIcon(props.vendor.icon, 28)
    : null
  const vendorName = props.vendor?.name
  const iconFallback =
    vendorName?.charAt(0) ||
    model.model_name?.charAt(0)?.toUpperCase() ||
    '?'

  const metaParts: string[] = []
  if (vendorName) metaParts.push(vendorName)
  if (contextLength) metaParts.push(`${t('Context')} ${contextLength}`)
  if (maxOutput) metaParts.push(`${t('Max output')} ${maxOutput}`)

  return (
    <ModelRowActionsLayoutContext.Provider value='card'>
      <div className='flex h-full min-h-36 flex-col gap-3'>
        <div className='flex items-start gap-3'>
          <div className='bg-muted/50 ring-border/60 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1'>
            {vendorIcon ?? (
              <span className='text-muted-foreground text-sm font-semibold'>
                {iconFallback}
              </span>
            )}
          </div>

          <div className='min-w-0 flex-1'>
            <div className='flex items-start gap-1'>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <h3 className='line-clamp-2 min-w-0 flex-1 break-all font-mono text-[15px] leading-snug font-semibold tracking-tight'>
                      {model.model_name}
                    </h3>
                  }
                />
                <TooltipContent side='top' className='max-w-sm break-all'>
                  {model.model_name}
                </TooltipContent>
              </Tooltip>
              <CopyButton
                value={model.model_name}
                className='text-muted-foreground/70 hover:text-foreground size-8 shrink-0'
                iconClassName='size-3.5'
                tooltip={t('Copy model name')}
                successTooltip={t('Copied!')}
                aria-label={t('Copy model name')}
              />
            </div>
            {metaParts.length > 0 ? (
              <p className='text-muted-foreground/80 mt-1 line-clamp-2 text-xs leading-relaxed'>
                {metaParts.join(' · ')}
              </p>
            ) : null}
          </div>
        </div>

        {description ? (
          <p className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>
            {description}
          </p>
        ) : null}

        <ModelCapabilityChips model={model} className='min-h-6' />

        <div className='border-border/60 text-muted-foreground mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs'>
          <div className='flex min-w-0 items-center gap-1.5'>
            <span className='font-medium shrink-0'>{t('Bound Channels')}</span>
            <span className='text-foreground text-sm'>
              <BoundChannelsCell channels={model.bound_channels} />
            </span>
          </div>
          {actionsCell ? (
            <div className='shrink-0'>{actionsCell}</div>
          ) : null}
        </div>
      </div>
    </ModelRowActionsLayoutContext.Provider>
  )
}

export const ModelCard = memo(ModelCardComponent)
