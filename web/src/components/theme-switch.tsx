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

type ThemeSwitchProps = {
  className?: string
  size?: 'default' | 'compact'
  variant?: 'segmented' | 'menu'
}

export function ThemeSwitch(props: ThemeSwitchProps) {
  const { t } = useTranslation()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const variant = props.variant ?? 'segmented'
  const size = props.size ?? 'default'

  if (variant === 'menu') {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='icon'
              className={cn(
                'relative h-9 w-9 overflow-hidden rounded-full',
                props.className
              )}
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
          {theme === 'system' ? (
            <span
              aria-hidden
              className='bg-info ring-background absolute right-1 bottom-1 size-1.5 rounded-full ring-2'
            />
          ) : null}
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

  const sizeClasses =
    size === 'compact'
      ? { root: 'h-7 gap-0.5 p-0.5', button: 'size-6', icon: 'size-3.5' }
      : { root: 'h-8 gap-1 p-1', button: 'size-6', icon: 'size-4' }

  return (
    <div
      aria-label={t('Toggle theme')}
      className={cn(
        'border-border bg-background inline-flex items-center rounded-full border transition-colors',
        sizeClasses.root,
        props.className
      )}
      role='radiogroup'
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon
        const isActive = theme === option.value
        return (
          <button
            key={option.value}
            type='button'
            role='radio'
            aria-checked={isActive}
            aria-label={t(option.label)}
            title={t(option.label)}
            className={cn(
              'inline-flex items-center justify-center rounded-full transition-colors',
              sizeClasses.button,
              isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setTheme(option.value)}
          >
            <Icon className={sizeClasses.icon} strokeWidth={1.5} />
          </button>
        )
      })}
    </div>
  )
}
