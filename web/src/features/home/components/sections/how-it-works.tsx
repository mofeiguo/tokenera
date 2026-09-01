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

export function HowItWorks() {
  const { t } = useTranslation()

  const rows = [
    {
      label: t('Model'),
      value: t('The public model name your application requested.'),
    },
    {
      label: t('Token usage'),
      value: t('Prompt and completion tokens recorded separately.'),
    },
    {
      label: t('Cost'),
      value: t('The settled charge for that request, not an estimate.'),
    },
    {
      label: t('Trace'),
      value: t('Request and upstream request IDs kept together.'),
    },
  ]

  return (
    <section className='bg-muted/35 border-y py-24 md:py-32'>
      <div className='mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-end lg:gap-24'>
        <div>
          <h2 className='font-display text-foreground max-w-xl min-w-0 text-4xl font-bold tracking-[-0.035em] [overflow-wrap:anywhere] md:text-5xl'>
            {t('The bill should never be a surprise.')}
          </h2>
          <p className='text-muted-foreground mt-6 max-w-xl text-base leading-7 md:text-lg'>
            {t(
              'Every request leaves a record of the model, channel, token usage, settled cost, and trace IDs. Compare usage without reconciling separate provider dashboards.'
            )}
          </p>
        </div>

        <dl className='bg-background divide-y rounded-xl border px-6 shadow-xs'>
          {rows.map((row) => (
            <div
              key={row.label}
              className='grid gap-2 py-5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-baseline'
            >
              <dt className='text-foreground font-mono text-xs font-semibold'>
                {row.label}
              </dt>
              <dd className='text-muted-foreground text-sm leading-6'>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
