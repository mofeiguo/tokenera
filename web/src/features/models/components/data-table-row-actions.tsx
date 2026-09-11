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
import type { Row } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Power, PowerOff, Trash2 } from 'lucide-react'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useQueryClient } from '@/lib/query'

import {
  handleDeleteModel,
  handleToggleModelStatus,
  isModelEnabled,
} from '../lib'
import type { Model } from '../types'
import { ModelRowActionsLayoutContext } from './model-row-actions-context'
import { useModels } from './models-provider'

interface DataTableRowActionsProps {
  row: Row<Model>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { t } = useTranslation()
  const layout = useContext(ModelRowActionsLayoutContext)
  const model = row.original
  const { setOpen, setCurrentRow } = useModels()
  const queryClient = useQueryClient()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const isEnabled = isModelEnabled(model)

  const handleEdit = () => {
    setCurrentRow(model)
    setOpen('update-model')
  }

  const handleToggleStatus = () => {
    handleToggleModelStatus(model.id, model.status, queryClient)
  }

  const toggleLabel = isEnabled ? t('Disable') : t('Enable')

  return (
    <div className='-ml-1.5 flex items-center gap-1'>
      {layout !== 'card' && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={handleEdit}
                aria-label={t('Edit')}
              />
            }
          >
            <Pencil />
          </TooltipTrigger>
          <TooltipContent>{t('Edit')}</TooltipContent>
        </Tooltip>
      )}

      {layout !== 'card' && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={handleToggleStatus}
                aria-label={toggleLabel}
                className={
                  isEnabled
                    ? 'text-destructive hover:text-destructive'
                    : 'text-success hover:text-success'
                }
              />
            }
          >
            {isEnabled ? <PowerOff /> : <Power />}
          </TooltipTrigger>
          <TooltipContent>{toggleLabel}</TooltipContent>
        </Tooltip>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              className='data-popup-open:bg-muted flex size-8 p-0'
              aria-label={t('Open menu')}
            />
          }
        >
          <MoreHorizontal className='size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          {layout === 'card' && (
            <DropdownMenuItem onClick={handleEdit}>
              {t('Edit')}
              <DropdownMenuShortcut>
                <Pencil size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
          {layout === 'card' && (
            <DropdownMenuItem onClick={handleToggleStatus}>
              {toggleLabel}
              <DropdownMenuShortcut>
                {isEnabled ? <PowerOff size={16} /> : <Power size={16} />}
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setDeleteConfirmOpen(true)
            }}
            className='text-destructive focus:text-destructive'
          >
            {t('Delete')}
            <DropdownMenuShortcut>
              <Trash2 size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('Delete Model')}
        desc={t(
          'Are you sure you want to delete model "{{name}}"? This action cannot be undone.',
          { name: model.model_name }
        )}
        confirmText={t('Delete')}
        destructive
        handleConfirm={() => {
          handleDeleteModel(model.id, queryClient)
          setDeleteConfirmOpen(false)
        }}
      />
    </div>
  )
}
