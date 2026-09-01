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

import { ModelsPrimaryButtons } from './models-primary-buttons'

export function ModelsPageHeader() {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
      <div className='min-w-0'>
        <h1 className='text-3xl font-bold tracking-tight'>{t('Models')}</h1>
        <p className='text-muted-foreground mt-2'>
          {t('Manage catalog models, vendors, and channel bindings.')}
        </p>
      </div>
      <div className='shrink-0'>
        <ModelsPrimaryButtons />
      </div>
    </div>
  )
}
