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
import { ArrowRight, Check, KeyRound, Route, WalletCards } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Link } from '@/lib/router'

import { HeroTerminalDemo } from '../hero-terminal-demo'

interface HeroProps {
  isAuthenticated?: boolean
}

const MODEL_NAMES = [
  'GPT',
  'Claude',
  'Gemini',
  'DeepSeek',
  'Qwen',
  'Llama',
  'Mistral',
  'MiniMax',
] as const

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const primaryHref = props.isAuthenticated ? '/playground' : '/sign-up'
  const primaryLabel = props.isAuthenticated
    ? t('Open Playground')
    : t('Create your API key')

  const gatewayFacts = [
    {
      icon: Route,
      title: t('One Base URL'),
      detail: t('Keep the client you already use.'),
    },
    {
      icon: KeyRound,
      title: t('One API key'),
      detail: t('Set model, quota, and IP limits per key.'),
    },
    {
      icon: WalletCards,
      title: t('One usage ledger'),
      detail: t('Tokens and cost stay attached to every request.'),
    },
  ]

  return (
    <section className='relative border-b pt-20 pb-24 md:pt-24 md:pb-32'>
      <div className='mx-auto max-w-7xl px-6'>
        <div className='grid min-w-0 items-center gap-14 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-16'>
          <div className='landing-animate-fade-up min-w-0'>
            <div className='mb-8 flex'>
              <span className='bg-muted text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm'>
                <Check className='text-success size-3.5' />
                {t('Multi-model API gateway')}
              </span>
            </div>

            <h1 className='font-display text-foreground max-w-[11ch] text-5xl font-bold tracking-[-0.045em] [overflow-wrap:anywhere] sm:text-6xl lg:text-7xl'>
              {t('Change models, not your integration.')}
            </h1>
            <p className='text-muted-foreground mt-7 max-w-xl text-base leading-7 md:text-lg md:leading-8'>
              {t(
                'Use one API key and one Base URL to call GPT, Claude, Gemini, DeepSeek, Qwen, and more. Keep the protocol your application already speaks.'
              )}
            </p>

            <div className='mt-9 flex flex-col gap-3 sm:flex-row'>
              <Button
                size='lg'
                className='h-12 rounded-full px-7'
                render={<Link to={primaryHref} />}
              >
                {primaryLabel}
                <ArrowRight />
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='h-12 rounded-full px-7'
                render={<Link to='/pricing' />}
              >
                {t('Compare models and pricing')}
              </Button>
            </div>

            <dl className='mt-12 grid gap-5 border-t pt-6 sm:grid-cols-3'>
              {gatewayFacts.map((fact) => (
                <div key={fact.title} className='min-w-0'>
                  <dt className='text-foreground flex items-center gap-2 text-sm font-semibold'>
                    <fact.icon className='text-muted-foreground size-4' />
                    {fact.title}
                  </dt>
                  <dd className='text-muted-foreground mt-2 text-sm leading-5'>
                    {fact.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className='landing-animate-fade-left min-w-0'>
            <div className='mb-4 flex items-end justify-between gap-4'>
              <div>
                <p className='text-foreground text-sm font-semibold'>
                  {t('One gateway, multiple protocols')}
                </p>
                <p className='text-muted-foreground mt-1 text-sm'>
                  {t('Send the request in the format your stack expects.')}
                </p>
              </div>
              <span className='text-muted-foreground hidden font-mono text-xs sm:block'>
                api.tokenera
              </span>
            </div>
            <HeroTerminalDemo className='max-w-none' />
          </div>
        </div>

        <div className='mt-16 flex flex-col gap-6 border-t pt-8 md:mt-24 md:flex-row md:items-center md:justify-between'>
          <p className='text-foreground max-w-md text-lg font-semibold tracking-tight'>
            {t('Pick the model for the request, not for the integration.')}
          </p>
          <div className='grid grid-cols-4 gap-x-5 gap-y-4 sm:grid-cols-8'>
            {MODEL_NAMES.map((name) => (
              <span
                key={name}
                className='text-muted-foreground text-center text-xs font-medium'
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
