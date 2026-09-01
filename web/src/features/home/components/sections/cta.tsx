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
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Link } from '@/lib/router'

interface CTAProps {
  isAuthenticated?: boolean
}

export function CTA(props: CTAProps) {
  const { t } = useTranslation()

  if (props.isAuthenticated) {
    return null
  }

  return (
    <section className='py-24 md:py-36'>
      <div className='mx-auto max-w-7xl px-6'>
        <div className='bg-foreground text-background grid gap-10 rounded-2xl px-7 py-10 sm:px-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:px-14 md:py-14'>
          <div>
            <h2 className='font-display max-w-xl min-w-0 text-4xl font-bold tracking-[-0.04em] [overflow-wrap:anywhere] md:text-5xl'>
              {t('Your first request needs one key.')}
            </h2>
            <p className='mt-5 max-w-xl text-base leading-7 opacity-70'>
              {t(
                'Create an account, issue an API key, and verify the route in Playground before changing your application.'
              )}
            </p>
          </div>
          <Button
            size='lg'
            variant='secondary'
            className='h-12 rounded-full px-7'
            render={<Link to='/sign-up' />}
          >
            {t('Create your API key')}
            <ArrowRight />
          </Button>
        </div>
      </div>
    </section>
  )
}
