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
import {
  ArrowRight,
  BarChart3,
  Boxes,
  KeyRound,
  Layers3,
  Sparkles,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PUBLIC_BRAND_NAME } from '@/components/layout/components/token-era-logo'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/router'

const PILLAR_ICONS = {
  gateway: Layers3,
  models: Boxes,
  studio: Sparkles,
  analytics: BarChart3,
} as const

export function AboutDefaultContent() {
  const { t } = useTranslation()

  const pillars = [
    {
      icon: PILLAR_ICONS.gateway,
      title: t('Unified API gateway'),
      detail: t(
        'Call GPT, Claude, Gemini, DeepSeek, Qwen, and more through one Base URL and one API key.'
      ),
    },
    {
      icon: PILLAR_ICONS.models,
      title: t('Model Square'),
      detail: t(
        'Compare capabilities, pricing, and availability before you route production traffic.'
      ),
    },
    {
      icon: PILLAR_ICONS.studio,
      title: t('Studio workspace'),
      detail: t(
        'Try chat, image, and video workflows in the browser before wiring them into your app.'
      ),
    },
    {
      icon: PILLAR_ICONS.analytics,
      title: t('Data Analytics'),
      detail: t(
        'Track model usage, vendor share, and momentum from one place instead of many dashboards.'
      ),
    },
  ]

  const principles = [
    {
      number: '01',
      title: t('One integration surface'),
      detail: t(
        'Your application keeps the protocol it already speaks. TokenEra handles provider differences behind the gateway.'
      ),
    },
    {
      number: '02',
      title: t('Transparent usage records'),
      detail: t(
        'Every request keeps model, token usage, settled cost, and trace IDs together so billing stays auditable.'
      ),
    },
    {
      number: '03',
      title: t('Operational control'),
      detail: t(
        'Channels, quotas, rate limits, and routing rules stay configurable without redeploying client code.'
      ),
    },
  ]

  const audiences = [
    t('Product teams shipping AI features without rebuilding provider adapters.'),
    t('Developers who want one key to test many models quickly.'),
    t('Operators who need routing, billing, and observability in one control plane.'),
  ]

  return (
    <div className='pb-24'>
      <section className='border-b pt-8 pb-20 md:pt-12 md:pb-28'>
        <div className='mx-auto max-w-7xl px-6'>
          <p className='text-muted-foreground mb-5 text-sm font-medium tracking-wide uppercase'>
            {t('About {{name}}', { name: PUBLIC_BRAND_NAME })}
          </p>
          <h1 className='font-display text-foreground max-w-4xl text-4xl font-bold tracking-[-0.03em] md:text-6xl'>
            {t('The control plane for multi-model AI.')}
          </h1>
          <p className='text-muted-foreground mt-7 max-w-3xl text-base leading-7 md:text-lg md:leading-8'>
            {t(
              '{{name}} helps teams connect applications to many model providers through one gateway, with clear pricing, routing, and usage records from the first request.',
              { name: PUBLIC_BRAND_NAME }
            )}
          </p>
        </div>
      </section>

      <section className='bg-muted/35 border-b py-20 md:py-28'>
        <div className='mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-20'>
          <div>
            <h2 className='font-display text-foreground text-3xl font-bold tracking-[-0.03em] md:text-4xl'>
              {t('Our mission')}
            </h2>
            <p className='text-muted-foreground mt-6 text-base leading-7 md:text-lg'>
              {t(
                'Model choice should not force an integration rewrite. We build the layer that keeps your client stable while providers, prices, and policies change underneath.'
              )}
            </p>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            {pillars.map((pillar) => (
              <article
                key={pillar.title}
                className='bg-background rounded-xl border p-6 shadow-xs'
              >
                <pillar.icon className='text-muted-foreground mb-4 size-5' />
                <h3 className='text-foreground text-lg font-semibold tracking-tight'>
                  {pillar.title}
                </h3>
                <p className='text-muted-foreground mt-3 text-sm leading-6'>
                  {pillar.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className='py-20 md:py-28'>
        <div className='mx-auto max-w-7xl px-6'>
          <div className='max-w-2xl'>
            <h2 className='font-display text-foreground text-3xl font-bold tracking-[-0.03em] md:text-4xl'>
              {t('What we optimize for')}
            </h2>
            <p className='text-muted-foreground mt-5 text-base leading-7'>
              {t(
                'TokenEra is designed for teams that need production-grade routing and accounting, not just a thin proxy.'
              )}
            </p>
          </div>

          <div className='mt-12 border-t'>
            {principles.map((principle) => (
              <article
                key={principle.number}
                className='grid gap-4 border-b py-7 sm:grid-cols-[3rem_minmax(0,0.85fr)_minmax(0,1.15fr)] sm:items-start sm:gap-6'
              >
                <span className='text-muted-foreground font-mono text-xs tabular-nums'>
                  {principle.number}
                </span>
                <h3 className='text-foreground text-lg font-semibold tracking-tight'>
                  {principle.title}
                </h3>
                <p className='text-muted-foreground text-sm leading-6 sm:col-start-2 sm:col-span-2 lg:col-start-3 lg:col-span-1'>
                  {principle.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className='bg-muted/35 border-y py-20 md:py-28'>
        <div className='mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start'>
          <div>
            <h2 className='font-display text-foreground text-3xl font-bold tracking-[-0.03em] md:text-4xl'>
              {t('Who TokenEra is for')}
            </h2>
            <p className='text-muted-foreground mt-5 text-base leading-7'>
              {t(
                'If your stack already speaks OpenAI-compatible APIs, you can start with a key and grow into routing, billing, and analytics.'
              )}
            </p>
          </div>

          <ul className='space-y-4'>
            {audiences.map((item) => (
              <li
                key={item}
                className='bg-background flex gap-3 rounded-xl border px-5 py-4 text-sm leading-6'
              >
                <KeyRound className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                <span className='text-foreground'>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className='py-20 md:py-28'>
        <div className='mx-auto max-w-7xl px-6'>
          <div className='bg-foreground text-background grid gap-8 rounded-2xl px-7 py-10 sm:px-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:px-14 md:py-14'>
            <div>
              <h2 className='font-display max-w-xl text-3xl font-bold tracking-[-0.03em] md:text-4xl'>
                {t('Ready to explore TokenEra?')}
              </h2>
              <p className='mt-4 max-w-xl text-base leading-7 opacity-70'>
                {t(
                  'Browse models, inspect analytics, or create an API key and send your first request.'
                )}
              </p>
            </div>
            <div className='flex flex-col gap-3 sm:flex-row md:flex-col md:items-stretch'>
              <Button
                size='lg'
                variant='secondary'
                className='h-11 rounded-full px-6'
                render={<Link to='/pricing' />}
              >
                {t('Explore Model Square')}
                <ArrowRight />
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='border-background/20 bg-background/10 text-background hover:bg-background/15 hover:text-background h-11 rounded-full px-6'
                render={<Link to='/rankings' />}
              >
                {t('View Data Analytics')}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
