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

import { ModelSelectorIcon } from '@/components/model-group-selector/model-display'

import {
  getPlaygroundModelCard,
  getPlaygroundSpecValueLabel,
  PLAYGROUND_SURFACE_CARD,
} from '../../lib'
import type { ModelOption } from '../../types'

type PlaygroundEmptyStateProps = {
  models: ModelOption[]
  modelValue: string
}

export function PlaygroundEmptyState(props: PlaygroundEmptyStateProps) {
  const { t } = useTranslation()
  const card = getPlaygroundModelCard(props.models, props.modelValue)

  return (
    <div className='flex min-h-[min(420px,calc(100svh-18rem))] flex-col items-center justify-center py-8 md:py-12'>
      {card ? (
        <article className={`${PLAYGROUND_SURFACE_CARD} w-full px-7 py-7`}>
          <header className='flex items-start gap-3'>
            <ModelSelectorIcon
              className='mt-0.5'
              icon={card.icon}
              label={card.label}
              size={28}
            />
            <div className='min-w-0'>
              <h2 className='text-foreground truncate text-lg font-semibold tracking-[-0.02em]'>
                {card.label}
              </h2>
              <p className='text-muted-foreground mt-1 truncate text-sm'>
                {card.vendorName || card.value}
              </p>
            </div>
          </header>

          {card.specs.length > 0 ? (
            <dl className='mt-5 grid gap-3 sm:grid-cols-2'>
              {card.specs.map((spec) => (
                <div key={spec.labelKey} className='min-w-0'>
                  <dt className='text-muted-foreground text-xs font-medium'>
                    {t(spec.labelKey)}
                  </dt>
                  <dd className='text-foreground mt-1 truncate text-sm'>
                    {spec.values
                      .map((value) => t(getPlaygroundSpecValueLabel(value)))
                      .join(' · ')}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </article>
      ) : (
        <p className='text-muted-foreground text-sm'>
          {t('Select a model to start')}
        </p>
      )}
    </div>
  )
}
