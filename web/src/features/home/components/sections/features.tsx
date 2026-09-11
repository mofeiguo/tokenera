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
import { ArrowDownRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Features() {
  const { t } = useTranslation()

  const capabilities = [
    {
      number: '01',
      title: t('Speak the protocol you already use'),
      detail: t(
        'Chat Completions, Responses, Claude Messages, and Gemini generateContent are available through the same gateway.'
      ),
    },
    {
      number: '02',
      title: t('Choose by capability and price'),
      detail: t(
        'Browse models for text, reasoning, vision, image, audio, video, tools, and embeddings before you send a request.'
      ),
    },
    {
      number: '03',
      title: t('Give every key a boundary'),
      detail: t(
        'Limit quota, models, IP addresses, groups, and expiration independently for each API key.'
      ),
    },
    {
      number: '04',
      title: t('Decide how traffic is routed'),
      detail: t(
        'Bind a public model to multiple channels, then control priority, weight, and retry policy.'
      ),
    },
  ]

  return (
    <section className='py-24 md:py-36'>
      <div className='mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-24'>
        <div>
          <h2 className='font-display text-foreground max-w-md min-w-0 text-4xl font-bold tracking-[-0.03em] [overflow-wrap:anywhere] md:text-5xl'>
            {t('Keep one integration. Change everything behind it.')}
          </h2>
          <p className='text-muted-foreground mt-6 max-w-md text-base leading-7'>
            {t(
              'TokenEra separates the interface your application calls from the model and channel that answer it.'
            )}
          </p>
        </div>

        <div className='border-t'>
          {capabilities.map((capability) => (
            <article
              key={capability.number}
              className='grid gap-4 border-b py-7 sm:grid-cols-[3rem_minmax(0,0.9fr)_minmax(0,1.1fr)_auto] sm:items-start sm:gap-6'
            >
              <span className='text-muted-foreground font-mono text-xs tabular-nums'>
                {capability.number}
              </span>
              <h3 className='text-foreground text-lg font-semibold tracking-tight'>
                {capability.title}
              </h3>
              <p className='text-muted-foreground max-w-lg text-sm leading-6'>
                {capability.detail}
              </p>
              <ArrowDownRight
                className='text-muted-foreground hidden size-4 sm:block'
                aria-hidden='true'
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
