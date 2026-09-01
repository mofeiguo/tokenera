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

import { Link } from '@/lib/router'

const MODEL_FAMILIES = [
  'GPT',
  'Claude',
  'Gemini',
  'DeepSeek',
  'Qwen',
  'Llama',
  'Mistral',
  'MiniMax',
] as const

export function Stats() {
  const { t } = useTranslation()

  return (
    <section className='border-border/60 border-t px-6 py-20 md:py-24'>
      <div className='mx-auto max-w-6xl'>
        <div className='flex flex-col gap-8 md:flex-row md:items-end md:justify-between'>
          <div className='max-w-xl'>
            <h2 className='font-display text-foreground text-3xl font-semibold tracking-tight md:text-4xl'>
              {t('All major models')}
            </h2>
            <p className='text-muted-foreground mt-3 text-base leading-relaxed'>
              {t(
                'GPT, Claude, Gemini, DeepSeek, Qwen and more in one catalog. No vendor lock-in.'
              )}
            </p>
          </div>
          <Link
            to='/pricing'
            className='text-foreground decoration-foreground/30 hover:decoration-foreground text-sm underline underline-offset-4'
          >
            {t('See all models')}
          </Link>
        </div>
        <ul className='mt-12 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4'>
          {MODEL_FAMILIES.map((name) => (
            <li
              key={name}
              className='border-border/70 text-foreground border-t pt-4 font-medium tracking-tight'
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
