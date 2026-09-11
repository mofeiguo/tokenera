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

import { ApiKeysPrimaryButtons } from './api-keys-primary-buttons'

export function ApiKeysPageHeader() {
  const { t } = useTranslation()

  return (
    <div className='flex items-center justify-between gap-4'>
      <h1 className='text-[28px] leading-none font-semibold tracking-tight text-[#171717] dark:text-foreground'>
        {t('API Keys')}
      </h1>
      <ApiKeysPrimaryButtons />
    </div>
  )
}
