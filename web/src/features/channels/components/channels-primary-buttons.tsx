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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ADMIN_PERMISSION_ACTIONS,
  ADMIN_PERMISSION_RESOURCES,
  hasPermission,
} from '@/lib/admin-permissions'
import { useQueryClient } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'

import {
  handleDeleteAllDisabled,
  handleTestAllChannels,
  handleUpdateAllBalances,
} from '../lib'
import {
  ChannelIconAdd,
  ChannelIconBalance,
  ChannelIconBatch,
  ChannelIconDelete,
  ChannelIconMore,
  ChannelIconTest,
} from './channel-icons'
import { useChannels } from './channels-provider'

export function ChannelsPrimaryButtons() {
  const { t } = useTranslation()
  const { setOpen, setCurrentRow, batchMode, setBatchMode } = useChannels()
  const queryClient = useQueryClient()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const currentUser = useAuthStore((s) => s.auth.user)
  const canEditSensitive = hasPermission(
    currentUser,
    ADMIN_PERMISSION_RESOURCES.CHANNEL,
    ADMIN_PERMISSION_ACTIONS.SENSITIVE_WRITE
  )

  const handleBatchModeToggle = (checked: boolean) => {
    setBatchMode(checked)
  }

  return (
    <>
      <div className='flex flex-wrap items-center justify-end gap-2'>
        <Tooltip>
          <TooltipTrigger render={<span className='inline-flex' />}>
            <Button
              onClick={() => {
                if (!canEditSensitive) return
                setCurrentRow(null)
                setOpen('create-channel')
              }}
              size='sm'
              disabled={!canEditSensitive}
            >
              <ChannelIconAdd />
              <span className='max-sm:hidden'>{t('Create Channel')}</span>
              <span className='sm:hidden'>{t('Create')}</span>
            </Button>
          </TooltipTrigger>
          {!canEditSensitive && (
            <TooltipContent>
              {t('No permission to perform this action')}
            </TooltipContent>
          )}
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant='outline' size='sm' />}>
            <ChannelIconMore />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            <DropdownMenuCheckboxItem
              checked={batchMode}
              onCheckedChange={handleBatchModeToggle}
            >
              <ChannelIconBatch className='mr-2' />
              {t('Batch Operations')}
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => {
                handleTestAllChannels(queryClient)
              }}
            >
              {t('Test All Channels')}
              <DropdownMenuShortcut>
                <ChannelIconTest className='size-4' />
              </DropdownMenuShortcut>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                handleUpdateAllBalances(queryClient)
              }}
            >
              {t('Update All Balances')}
              <DropdownMenuShortcut>
                <ChannelIconBalance className='size-4' />
              </DropdownMenuShortcut>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                if (!canEditSensitive) return
                setShowDeleteDialog(true)
              }}
              disabled={!canEditSensitive}
              className='text-destructive focus:text-destructive'
            >
              {t('Delete All Disabled')}
              <DropdownMenuShortcut>
                <ChannelIconDelete className='size-4' />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t('Delete All Disabled Channels?')}
        desc={t(
          'This will permanently delete all manually and automatically disabled channels. This action cannot be undone.'
        )}
        destructive
        handleConfirm={() => {
          if (!canEditSensitive) return
          handleDeleteAllDisabled(queryClient)
          setShowDeleteDialog(false)
        }}
      />
    </>
  )
}
