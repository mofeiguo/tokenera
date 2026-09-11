/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
    10|but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Add01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { copyToClipboard } from '@/lib/copy-to-clipboard'
import { cn } from '@/lib/utils'

export type Option = {
  label: string
  value: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
  allowCreate?: boolean
  /**
   * Label shown for the "create" item in the dropdown.
   * Supports the `{{value}}` placeholder which is replaced with the typed input.
   * Falls back to `Add "{{value}}"` when omitted.
   */
  createLabel?: string
  /** Empty state text. Defaults to "No matching items". */
  emptyText?: string
  /** Optional `id` to wire labels/aria-describedby to the input. */
  id?: string
  /** Disable the entire control. */
  disabled?: boolean
  /**
   * Limits rendered chips while keeping all values selected.
   * Hidden values remain searchable/removable from the dropdown.
   */
  maxVisibleChips?: number
  /**
   * Replaces individual chips with a compact summary while preserving the
   * normal dropdown/search behaviour.
   */
  renderSelectedSummary?: (values: string[]) => React.ReactNode
  /**
   * When true, clicking a chip's label copies its value to the clipboard
   * instead of being inert. The remove (×) button keeps its own behaviour.
   */
  copyChipOnClick?: boolean
}

const COMMA_REGEX = /[,，\n]/
const CHIPS_CLASS_NAME =
  'border-input focus-within:border-ring focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-destructive/20 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40 flex min-h-8 flex-wrap items-center gap-1 rounded-lg border bg-transparent bg-clip-padding px-2.5 py-1 text-sm transition-colors focus-within:ring-3 has-aria-invalid:ring-3 has-data-[slot=combobox-chip]:px-1'
const CHIP_CLASS_NAME =
  'bg-muted text-foreground flex h-[calc(--spacing(5.25))] w-fit items-center justify-center gap-1 rounded-sm px-1.5 text-xs font-medium whitespace-nowrap has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-0'

function splitDraft(value: string): { completed: string[]; draft: string } {
  if (!COMMA_REGEX.test(value)) {
    return { completed: [], draft: value }
  }
  const normalized = value.replaceAll('，', ',').replaceAll('\n', ',')
  const parts = normalized.split(',')
  const draft = parts.at(-1) ?? ''
  const completed = parts
    .slice(0, -1)
    .map((part) => part.trim())
    .filter(Boolean)
  return { completed, draft }
}

/**
 * MultiSelect — tags/chips style multi-select on Radix Popover + Command.
 *
 * Behaviour:
 * - Search filters built-in options.
 * - When `allowCreate` is true, custom values can be added inline:
 *   - Type and press Enter / "," to add a single value.
 *   - Paste a comma- (or newline-) separated list to add many at once.
 *   - A "Add \"<value>\"" item appears at the top of the dropdown when the
 *     typed text doesn't match any option.
 * - Backspace on an empty input removes the last selected chip.
 * - `maxVisibleChips` can cap large selections and show a compact "+N more"
 *   summary so forms do not grow vertically without bound.
 */
export function MultiSelect(props: MultiSelectProps) {
  const { t } = useTranslation()
  const placeholder = props.placeholder ?? t('Select items...')
  const chipsRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [inputValue, setInputValue] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)

  const selectedSet = React.useMemo(
    () => new Set(props.selected),
    [props.selected]
  )

  const labelMap = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const option of props.options) {
      map.set(option.value, option.label)
    }
    return map
  }, [props.options])

  const trimmedInput = inputValue.trim()
  const inputMatchesExisting =
    trimmedInput.length > 0 &&
    (selectedSet.has(trimmedInput) ||
      props.options.some(
        (option) =>
          option.value === trimmedInput || option.label === trimmedInput
      ))

  const canCreate =
    props.allowCreate === true &&
    trimmedInput.length > 0 &&
    !inputMatchesExisting

  const items = React.useMemo(() => {
    const set = new Set<string>(props.options.map((option) => option.value))
    for (const value of props.selected) {
      set.add(value)
    }
    if (canCreate) {
      set.add(trimmedInput)
    }
    return [...set]
  }, [props.options, props.selected, canCreate, trimmedInput])

  const query = inputValue.toLowerCase().trim()
  const visibleItems = React.useMemo(() => {
    if (!query) return items
    return items.filter((item) => {
      if (canCreate && item === trimmedInput) return true
      const label = (labelMap.get(item) ?? item).toLowerCase()
      return label.includes(query) || item.toLowerCase().includes(query)
    })
  }, [items, query, canCreate, trimmedInput, labelMap])

  const addValues = React.useCallback(
    (values: string[]) => {
      const next: string[] = []
      const seen = new Set<string>(props.selected)
      for (const raw of values) {
        const value = raw.trim()
        if (!value) continue
        if (seen.has(value)) continue
        seen.add(value)
        next.push(value)
      }
      if (next.length === 0) return
      props.onChange([...props.selected, ...next])
    },
    [props]
  )

  const handleInputValueChange = (value: string) => {
    if (!props.allowCreate) {
      setInputValue(value)
      return
    }
    const parsed = splitDraft(value)
    if (parsed.completed.length > 0) {
      addValues(parsed.completed)
      setInputValue(parsed.draft)
      return
    }
    setInputValue(value)
  }

  const keepPopoverOpen = React.useCallback(() => {
    requestAnimationFrame(() => {
      setOpen(true)
      inputRef.current?.focus()
    })
  }, [])

  const handleToggle = (item: string) => {
    if (canCreate && item === trimmedInput) {
      addValues([item])
      setInputValue('')
      keepPopoverOpen()
      return
    }
    if (selectedSet.has(item)) {
      props.onChange(props.selected.filter((value) => value !== item))
      keepPopoverOpen()
      return
    }
    addValues([item])
    setInputValue('')
    keepPopoverOpen()
  }

  const handleCopyChip = React.useCallback(
    async (
      event: React.MouseEvent<HTMLButtonElement>,
      value: string,
      label: string
    ) => {
      event.preventDefault()
      event.stopPropagation()
      const ok = await copyToClipboard(value)
      if (ok) {
        toast.success(t('Copied: {{model}}', { model: label }))
      } else {
        toast.error(t('Failed to copy'))
      }
    },
    [t]
  )

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === 'Backspace' &&
      inputValue === '' &&
      props.selected.length > 0
    ) {
      event.preventDefault()
      props.onChange(props.selected.slice(0, -1))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      if (canCreate) {
        const hasHighlight =
          document.querySelector(
            '[data-slot="combobox-content"] [data-selected="true"]'
          ) != null
        if (!hasHighlight) {
          addValues([trimmedInput])
          setInputValue('')
        }
      }
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (props.disabled) return
    setOpen(nextOpen)
  }

  const shouldLimit = typeof props.maxVisibleChips === 'number' && !expanded
  const visibleValues = shouldLimit
    ? props.selected.slice(0, props.maxVisibleChips)
    : props.selected
  const hiddenCount = props.selected.length - visibleValues.length

  let selectedChips: React.ReactNode = null
  if (props.renderSelectedSummary) {
    if (props.selected.length > 0) {
      selectedChips = (
        <span className='bg-muted text-muted-foreground flex h-[calc(--spacing(5.25))] w-fit items-center justify-center rounded-sm px-1.5 font-mono text-xs font-medium whitespace-nowrap'>
          {props.renderSelectedSummary(props.selected)}
        </span>
      )
    }
  } else {
    selectedChips = (
      <>
        {visibleValues.map((value) => {
          const label = labelMap.get(value) ?? value
          return (
            <span
              key={value}
              data-slot='combobox-chip'
              className={CHIP_CLASS_NAME}
            >
              {props.copyChipOnClick ? (
                <button
                  type='button'
                  onClick={(event) => handleCopyChip(event, value, label)}
                  onPointerDown={(event) => event.stopPropagation()}
                  title={t('Click to copy')}
                  className='max-w-[16rem] cursor-pointer truncate rounded-sm hover:underline'
                >
                  {label}
                </button>
              ) : (
                <span className='max-w-[16rem] truncate'>{label}</span>
              )}
              <Button
                type='button'
                variant='ghost'
                size='icon-xs'
                data-slot='combobox-chip-remove'
                className='-ml-1 opacity-50 hover:opacity-100'
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  props.onChange(
                    props.selected.filter((item) => item !== value)
                  )
                }}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  className='pointer-events-none'
                />
              </Button>
            </span>
          )
        })}
        {hiddenCount > 0 && (
          <button
            type='button'
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setExpanded(true)
            }}
            onPointerDown={(event) => event.stopPropagation()}
            title={t('Show All')}
            className='bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground flex h-[calc(--spacing(5.25))] w-fit cursor-pointer items-center justify-center rounded-sm px-1.5 text-xs font-medium whitespace-nowrap transition-colors'
          >
            {t('+{{count}} more', { count: hiddenCount })}
          </button>
        )}
        {expanded &&
          typeof props.maxVisibleChips === 'number' &&
          props.selected.length > props.maxVisibleChips && (
            <button
              type='button'
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setExpanded(false)
              }}
              onPointerDown={(event) => event.stopPropagation()}
              title={t('Collapse')}
              className='bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground flex h-[calc(--spacing(5.25))] w-fit cursor-pointer items-center justify-center rounded-sm px-1.5 text-xs font-medium whitespace-nowrap transition-colors'
            >
              {t('Collapse')}
            </button>
          )}
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
      <Command
        shouldFilter={false}
        className='h-auto w-full overflow-visible rounded-none bg-transparent p-0'
      >
        <PopoverAnchor asChild>
          <div
            ref={chipsRef}
            data-slot='combobox-chips'
            className={cn(
              CHIPS_CLASS_NAME,
              props.disabled &&
                'pointer-events-none cursor-not-allowed opacity-50',
              props.className
            )}
            onClick={() => inputRef.current?.focus()}
          >
            {selectedChips}
            <input
              ref={inputRef}
              id={props.id}
              value={inputValue}
              disabled={props.disabled}
              placeholder={
                props.selected.length === 0 && !props.renderSelectedSummary
                  ? placeholder
                  : undefined
              }
              aria-label={placeholder}
              aria-expanded={open}
              aria-autocomplete='list'
              role='combobox'
              autoComplete='off'
              className='min-w-16 flex-1 bg-transparent outline-none'
              onChange={(event) => {
                handleInputValueChange(event.target.value)
                if (!open) setOpen(true)
              }}
              onFocus={() => {
                if (!props.disabled) setOpen(true)
              }}
              onKeyDown={handleKeyDown}
            />
          </div>
        </PopoverAnchor>

        <PopoverContent
          align='start'
          sideOffset={6}
          data-slot='combobox-content'
          className='z-[100] w-[var(--radix-popover-anchor-width)] p-0'
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => {
            if (chipsRef.current?.contains(event.target as Node)) {
              event.preventDefault()
            }
          }}
          onFocusOutside={(event) => {
            if (chipsRef.current?.contains(event.target as Node)) {
              event.preventDefault()
            }
          }}
        >
          <CommandList>
            {visibleItems.length === 0 ? (
              <CommandEmpty>
                {props.emptyText ?? t('No matching items')}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {visibleItems.map((item) => {
                  const isCreate = canCreate && item === trimmedInput
                  const label = labelMap.get(item) ?? item
                  return (
                    <CommandItem
                      key={item}
                      value={item}
                      data-checked={selectedSet.has(item) && !isCreate}
                      className={isCreate ? 'text-foreground' : undefined}
                      onSelect={() => handleToggle(item)}
                    >
                      {isCreate ? (
                        <>
                          <HugeiconsIcon
                            icon={Add01Icon}
                            strokeWidth={2}
                            className='text-muted-foreground'
                            aria-hidden='true'
                          />
                          <span className='truncate'>
                            {props.createLabel
                              ? t(props.createLabel, { value: item })
                              : t('Add "{{value}}"', { value: item })}
                          </span>
                        </>
                      ) : (
                        <span className='truncate'>{label}</span>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </PopoverContent>
      </Command>
    </Popover>
  )
}
