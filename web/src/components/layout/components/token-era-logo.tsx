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
import { cn } from '@/lib/utils'

export const PUBLIC_BRAND_NAME = 'TokenEra'

type TokenEraLogoProps = {
  className?: string
}

export function TokenEraLogo(props: TokenEraLogoProps) {
  return (
    <svg
      viewBox='0 0 132 40'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('text-foreground h-10 w-auto', props.className)}
      role='img'
      aria-label={PUBLIC_BRAND_NAME}
    >
      <title>{PUBLIC_BRAND_NAME}</title>
      <text
        x='0'
        y='29'
        fill='currentColor'
        fontFamily='var(--font-display)'
        fontSize='26'
        fontWeight='700'
        letterSpacing='-0.04em'
      >
        {PUBLIC_BRAND_NAME}
      </text>
    </svg>
  )
}
