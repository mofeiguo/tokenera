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
import { AlertCircle, AlertTriangle, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import {
  FALLBACK_ERROR_CONTENT,
  getMessageErrorState,
  isAdminRole,
  MODEL_PRICING_SETTINGS_PATH,
} from '../../lib'
import type { Message } from '../../types'

interface MessageErrorProps {
  message: Message
  className?: string
  actions?: ReactNode
}

export function MessageError({
  message,
  className = '',
  actions,
}: MessageErrorProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.auth.user)
  const errorState = getMessageErrorState(message, isAdminRole(user?.role))

  if (!errorState) {
    return null
  }

  const content =
    errorState.content === FALLBACK_ERROR_CONTENT
      ? t(FALLBACK_ERROR_CONTENT)
      : errorState.content
  const isPriceError = errorState.kind === 'model-price'

  return (
    <div
      className={cn(
        'border-playground-composer-border bg-playground-composer w-full max-w-[78ch] rounded-[12px] border px-4 py-3',
        className
      )}
      role='alert'
    >
      <div className='flex items-start gap-2.5'>
        {isPriceError ? (
          <AlertTriangle className='text-warning mt-0.5 size-4 shrink-0' />
        ) : (
          <AlertCircle className='text-destructive mt-0.5 size-4 shrink-0' />
        )}
        <div className='min-w-0 space-y-2'>
          <p className='text-foreground text-sm font-medium'>
            {isPriceError ? t('Model Price Not Configured') : t('Error')}
          </p>
          <p className='text-muted-foreground text-sm leading-6'>{content}</p>
          {isPriceError && errorState.showSettingsLink ? (
            <Button
              variant='outline'
              size='sm'
              onClick={() => window.open(MODEL_PRICING_SETTINGS_PATH, '_blank')}
            >
              <Settings className='mr-1 h-3.5 w-3.5' />
              {t('Go to Settings')}
            </Button>
          ) : null}
          {actions}
        </div>
      </div>
    </div>
  )
}
