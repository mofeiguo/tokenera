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
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { apiKeysHeadClass } from './api-keys-styles'

export function ApiKeysListHeader() {
  const { t } = useTranslation()

  return (
    <thead>
      <tr>
        <th className={cn(apiKeysHeadClass, 'w-[16%]')}>{t('Name')}</th>
        <th className={cn(apiKeysHeadClass, 'w-[22%]')}>{t('API Key')}</th>
        <th className={cn(apiKeysHeadClass, 'hidden w-[12%] lg:table-cell')}>
          {t('Quota')}
        </th>
        <th className={cn(apiKeysHeadClass, 'hidden w-[13%] lg:table-cell')}>
          {t('Last Used')}
        </th>
        <th className={cn(apiKeysHeadClass, 'hidden w-[13%] lg:table-cell')}>
          {t('Expires')}
        </th>
        <th className={cn(apiKeysHeadClass, 'hidden w-[16%] lg:table-cell')}>
          {t('Models')}
        </th>
        <th className={cn(apiKeysHeadClass, 'w-10')}>
          <span className='sr-only'>{t('Actions')}</span>
        </th>
      </tr>
    </thead>
  )
}
