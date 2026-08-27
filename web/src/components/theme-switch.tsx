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
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Theme, useTheme } from '@/context/theme-provider'
import { cn } from '@/lib/utils'

const OPTIONS: Array<{
  value: Theme
  label: 'Light' | 'Dark' | 'System'
  icon: typeof Sun
}> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function ThemeSwitch() {
  const { t } = useTranslation()
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='icon'
            className='relative h-9 w-9 overflow-hidden rounded-full'
            aria-label={t('Toggle theme')}
          />
        }
      >
        <Sun
          aria-hidden
          className={cn(
            'absolute size-[1.15rem] transition-[transform,opacity] duration-200 ease-out',
            resolvedTheme === 'light'
              ? 'scale-100 rotate-0 opacity-100'
              : 'scale-50 rotate-90 opacity-0'
          )}
        />
        <Moon
          aria-hidden
          className={cn(
            'absolute size-[1.05rem] transition-[transform,opacity] duration-200 ease-out',
            resolvedTheme === 'dark'
              ? 'scale-100 rotate-0 opacity-100'
              : 'scale-50 -rotate-90 opacity-0'
          )}
        />
        {theme === 'system' && (
          <span
            aria-hidden
            className='bg-info ring-background absolute right-1 bottom-1 size-1.5 rounded-full ring-2'
          />
        )}
        <span className='sr-only'>{t('Toggle theme')}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-36'>
        {OPTIONS.map((option) => {
          const Icon = option.icon
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
            >
              <Icon aria-hidden className='size-4' />
              <span>{t(option.label)}</span>
              <Check
                aria-hidden
                className={cn(
                  'ms-auto size-4',
                  theme !== option.value && 'invisible'
                )}
              />
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
