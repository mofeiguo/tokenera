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
import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type ShimmerCtaButtonProps = {
  children: ReactNode
  className?: string
  size?: 'md' | 'lg'
}

export function ShimmerCtaButton(props: ShimmerCtaButtonProps) {
  const size = props.size ?? 'lg'
  return (
    <span
      className={cn(
        'landing-shimmer-cta group relative z-0 inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/10 whitespace-nowrap text-white',
        'shadow-2xl shadow-blue-500/25 transition-transform duration-300 active:translate-y-px',
        size === 'lg' && 'px-10 py-3.5 md:px-12 md:py-4',
        size === 'md' && 'px-8 py-4',
        props.className
      )}
      style={
        {
          '--spread': '90deg',
          '--shimmer-color': '#ffffff',
          '--speed': '3s',
          '--cut': '0.05em',
          '--bg': 'rgb(37, 99, 235)',
        } as CSSProperties
      }
    >
      <span className='landing-shimmer-cta-spark pointer-events-none absolute inset-0 -z-30 overflow-visible blur-[2px]'>
        <span className='landing-shimmer-cta-slide absolute inset-0 [aspect-ratio:1] h-[100cqh]'>
          <span className='landing-shimmer-cta-spin absolute -inset-full w-auto rotate-0' />
        </span>
      </span>
      <span
        className={cn(
          'relative z-10 flex items-center gap-3 leading-none tracking-tight',
          size === 'lg' && 'text-xl font-bold md:text-2xl',
          size === 'md' && 'text-base font-medium'
        )}
      >
        {props.children}
      </span>
      <span className='pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_-8px_10px_#ffffff1f] transition-shadow duration-300 group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]' />
      <span className='landing-shimmer-cta-backdrop pointer-events-none absolute -z-20' />
    </span>
  )
}
