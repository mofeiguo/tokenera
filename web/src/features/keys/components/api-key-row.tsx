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
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { toIntlLocale } from '@/i18n/languages'
import { formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'

import { API_KEY_STATUS, API_KEY_STATUSES } from '../constants'
import type { ApiKey } from '../types'
import { ApiKeyTimestampCell } from './api-key-timestamp-cell'
import { ApiKeyCell } from './api-keys-cells'
import { apiKeysCellClass, apiKeysRowClass } from './api-keys-styles'
import { DataTableRowActions } from './data-table-row-actions'

const STATUS_DOT: Record<number, string> = {
  [API_KEY_STATUS.ENABLED]: 'bg-[#171717]',
  [API_KEY_STATUS.DISABLED]: 'bg-[#bbbbbb]',
  [API_KEY_STATUS.EXPIRED]: 'bg-[#f59e0b]',
  [API_KEY_STATUS.EXHAUSTED]: 'bg-[#ef4444]',
}

const metaClass = 'truncate font-sans text-[13px] font-normal text-[#8a8a8a]'

function ApiKeyRowComponent(props: { apiKey: ApiKey; now: number }) {
  const { t, i18n } = useTranslation()
  const apiKey = props.apiKey
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const justNowLabel = t('Just now')
  const status = API_KEY_STATUSES[apiKey.status]
  const isEnabled = apiKey.status === API_KEY_STATUS.ENABLED
  const isExpired = apiKey.status === API_KEY_STATUS.EXPIRED
  const quotaLabel = apiKey.unlimited_quota
    ? t('Unlimited')
    : formatQuota(apiKey.remain_quota)
  const models = apiKey.model_limits_enabled
    ? (apiKey.model_limits?.split(',').map((item) => item.trim()).filter(Boolean) ??
      [])
    : []
  const modelsLabel =
    models.length === 0 ? t('All Models') : models.join(', ')

  return (
    <tr className={apiKeysRowClass} data-status={isEnabled ? 'enabled' : 'disabled'}>
      <td className={cn(apiKeysCellClass, 'w-[16%]')}>
        <div className='flex min-w-0 items-center gap-2'>
          <h3 className='truncate text-[13px] font-medium text-[#3d3d3d] dark:text-foreground'>
            {apiKey.name}
          </h3>
          {status ? (
            <span className='inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[#8a8a8a]'>
              <span
                aria-label={t(status.label)}
                className={cn(
                  'size-1.5 rounded-full',
                  STATUS_DOT[apiKey.status] ?? 'bg-[#bbbbbb]'
                )}
              />
              {isEnabled ? null : t(status.label)}
            </span>
          ) : null}
        </div>
      </td>
      <td className={cn(apiKeysCellClass, 'w-[22%]')}>
        <ApiKeyCell apiKey={apiKey} />
      </td>
      <td className={cn(apiKeysCellClass, 'hidden w-[12%] text-[#525252] lg:table-cell dark:text-foreground')}>
        {quotaLabel}
      </td>
      <td className={cn(apiKeysCellClass, 'hidden w-[13%] lg:table-cell')}>
        {!apiKey.accessed_time || apiKey.accessed_time === -1 ? (
          <span className='text-[#8a8a8a]'>{t('Unused')}</span>
        ) : (
          <ApiKeyTimestampCell
            className={metaClass}
            justNowLabel={justNowLabel}
            locale={locale}
            now={props.now}
            timestamp={apiKey.accessed_time}
          />
        )}
      </td>
      <td className={cn(apiKeysCellClass, 'hidden w-[13%] lg:table-cell')}>
        {apiKey.expired_time === -1 ? (
          <span className='text-[#8a8a8a]'>{t('Never expires')}</span>
        ) : (
          <ApiKeyTimestampCell
            className={cn(metaClass, isExpired && 'text-destructive')}
            justNowLabel={justNowLabel}
            locale={locale}
            now={props.now}
            timestamp={apiKey.expired_time}
          />
        )}
      </td>
      <td className={cn(apiKeysCellClass, 'hidden w-[16%] lg:table-cell')}>
        <span
          className={cn(
            'block truncate',
            models.length === 0 ? 'text-[#8a8a8a]' : 'text-[#525252] dark:text-foreground'
          )}
          title={modelsLabel}
        >
          {modelsLabel}
        </span>
      </td>
      <td className={cn(apiKeysCellClass, 'w-10 text-right')}>
        <DataTableRowActions apiKey={apiKey} />
      </td>
    </tr>
  )
}

export const ApiKeyRow = memo(ApiKeyRowComponent)
