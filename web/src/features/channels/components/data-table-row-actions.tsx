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
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
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
import { Spinner } from '@/components/ui/spinner'
import {
  ADMIN_PERMISSION_ACTIONS,
  ADMIN_PERMISSION_RESOURCES,
  hasPermission,
} from '@/lib/admin-permissions'
import { useQueryClient } from '@/lib/query'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import {
  handleDeleteChannel,
  handleToggleChannelStatus,
  isChannelEnabled,
  isMultiKeyChannel,
  CHANNEL_ACTION_DISABLE,
  CHANNEL_ACTION_ENABLE,
  CHANNEL_ACTION_NEUTRAL,
  CHANNEL_ACTION_TEST,
} from '../lib'
import type { Channel } from '../types'
import {
  ChannelIconBalance,
  ChannelIconCopy,
  ChannelIconDelete,
  ChannelIconDownload,
  ChannelIconEdit,
  ChannelIconKey,
  ChannelIconMore,
  ChannelIconPowerOff,
  ChannelIconPowerOn,
  ChannelIconTest,
} from './channel-icons'
import { ChannelRowActionsLayoutContext } from './channel-row-actions-context'
import { useChannels } from './channels-provider'

interface DataTableRowActionsProps {
  row: Row<Channel>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { t } = useTranslation()
  const layout = useContext(ChannelRowActionsLayoutContext)
  const channel = row.original
  const { setOpen, setCurrentRow } = useChannels()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.auth.user)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  const isEnabled = isChannelEnabled(channel)
  const isMultiKey = isMultiKeyChannel(channel)
  const canEditSensitive = hasPermission(
    currentUser,
    ADMIN_PERMISSION_RESOURCES.CHANNEL,
    ADMIN_PERMISSION_ACTIONS.SENSITIVE_WRITE
  )

  const handleEdit = () => {
    setCurrentRow(channel)
    setOpen('update-channel')
  }

  const handleTest = () => {
    setCurrentRow(channel)
    setOpen('test-channel')
  }

  const handleQueryBalance = () => {
    setCurrentRow(channel)
    setOpen('balance-query')
  }

  const handleFetchModels = () => {
    setCurrentRow(channel)
    setOpen('fetch-models')
  }

  const handleCopy = () => {
    setCurrentRow(channel)
    setOpen('copy-channel')
  }

  const handleManageKeys = () => {
    setCurrentRow(channel)
    setOpen('multi-key-manage')
  }

  const handleToggleStatus = async () => {
    setIsTogglingStatus(true)
    try {
      await handleToggleChannelStatus(channel.id, channel.status, queryClient)
    } finally {
      setIsTogglingStatus(false)
    }
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
                className={CHANNEL_ACTION_NEUTRAL}
                onClick={(e) => {
                  e.stopPropagation()
                  handleEdit()
                }}
                aria-label={t('Edit')}
              />
            }
          >
            <ChannelIconEdit />
          </TooltipTrigger>
          <TooltipContent>{t('Edit')}</TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              className={CHANNEL_ACTION_TEST}
              onClick={(e) => {
                e.stopPropagation()
                handleTest()
              }}
              aria-label={t('Test Connection')}
            />
          }
        >
          <ChannelIconTest />
        </TooltipTrigger>
        <TooltipContent>{t('Test Connection')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={(e) => {
                e.stopPropagation()
                void handleToggleStatus()
              }}
              disabled={isTogglingStatus}
              aria-label={toggleLabel}
              className={
                isEnabled ? CHANNEL_ACTION_DISABLE : CHANNEL_ACTION_ENABLE
              }
            />
          }
        >
          {isTogglingStatus ? (
            <Spinner className='size-4' />
          ) : isEnabled ? (
            <ChannelIconPowerOff />
          ) : (
            <ChannelIconPowerOn />
          )}
        </TooltipTrigger>
        <TooltipContent>{toggleLabel}</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              className={cn(
                'data-popup-open:bg-muted flex size-8 p-0',
                CHANNEL_ACTION_NEUTRAL
              )}
              aria-label={t('Open menu')}
            />
          }
        >
          <ChannelIconMore />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          {layout === 'card' && (
            <DropdownMenuItem onClick={handleEdit}>
              {t('Edit')}
              <DropdownMenuShortcut>
                <ChannelIconEdit className='size-4' />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={handleQueryBalance}>
            {t('Query Balance')}
            <DropdownMenuShortcut>
              <ChannelIconBalance className='size-4' />
            </DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleFetchModels}>
            {t('Fetch Models')}
            <DropdownMenuShortcut>
              <ChannelIconDownload className='size-4' />
            </DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={!canEditSensitive}
            onClick={canEditSensitive ? handleCopy : undefined}
          >
            {t('Copy Channel')}
            <DropdownMenuShortcut>
              <ChannelIconCopy className='size-4' />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          {!canEditSensitive && (
            <DropdownMenuItem disabled className='text-xs normal-case'>
              {t('No permission to perform this action')}
            </DropdownMenuItem>
          )}

          {isMultiKey && (
            <DropdownMenuItem onClick={handleManageKeys}>
              {t('Manage Keys')}
              <DropdownMenuShortcut>
                <ChannelIconKey className='size-4' />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={!canEditSensitive}
            onSelect={(e) => {
              e.preventDefault()
              if (!canEditSensitive) return
              setDeleteConfirmOpen(true)
            }}
            className='text-destructive focus:text-destructive'
          >
            {t('Delete')}
            <DropdownMenuShortcut>
              <ChannelIconDelete className='size-4' />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('Delete Channel')}
        desc={t(
          'Are you sure you want to delete channel "{{name}}"? This action cannot be undone.',
          { name: channel.name }
        )}
        confirmText={t('Delete')}
        destructive
        handleConfirm={() => {
          if (!canEditSensitive) return
          handleDeleteChannel(channel.id, queryClient)
          setDeleteConfirmOpen(false)
        }}
      />
    </div>
  )
}
