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
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronsUpDown,
  CpuIcon,
  Search,
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

import {
  modelGroupSelectorLayoutClasses,
  scrollSelectedOptionIntoView,
} from './model-group-selector/layout'
import {
  formatModelSelectorListLabel,
  formatModelSelectorTriggerLabel,
  ModelSelectorIcon,
  type ModelSelectorOption,
} from './model-group-selector/model-display'
import {
  filterPlaygroundModels,
  type ModelCategoryTab,
  type ModelSortMode,
  type PlaygroundModelOption,
} from './model-group-selector/model-filters'
import { zenmuxModelPanelClasses } from './model-group-selector/panel-styles'

interface ModelOption extends PlaygroundModelOption {}

interface ModelSelectorProps {
  selectedModel: string
  models: ModelOption[]
  onModelChange: (value: string) => void
  className?: string
  disabled?: boolean
}

const ModelTriggerButton = React.forwardRef<
  React.ComponentRef<typeof Button>,
  React.ComponentPropsWithoutRef<typeof Button> & {
    currentLabel: string
    triggerClassName?: string
    isDisabled?: boolean
  }
>(({ currentLabel, triggerClassName, isDisabled, ...props }, ref) => (
  <Button
    ref={ref}
    variant='outline'
    role='combobox'
    size='sm'
    disabled={isDisabled}
    className={cn(
      'flex h-8 items-center gap-2 border px-3 font-medium',
      'justify-center p-0 sm:w-auto sm:justify-start sm:px-3',
      'w-8',
      'bg-background text-foreground',
      'hover:bg-accent transition-colors',
      'focus:!ring-0 focus:!outline-none',
      'shadow-none',
      triggerClassName
    )}
    {...props}
  >
    <CpuIcon className='text-muted-foreground block size-4 sm:hidden' />
    <span className='text-muted-foreground sm:text-foreground hidden truncate text-xs sm:block'>
      {currentLabel}
    </span>
    <ChevronsUpDown className='text-muted-foreground hidden h-4 w-4 opacity-50 sm:block' />
  </Button>
))

ModelTriggerButton.displayName = 'ModelTriggerButton'

/**
 * Model Selector Component
 * Styled following Scira's form-component design patterns
 */
export const ModelSelector: React.FC<ModelSelectorProps> = React.memo(
  ({ selectedModel, models, onModelChange, className, disabled = false }) => {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const isMobile = useIsMobile()

    const currentModel = useMemo(
      () => models.find((m) => m.value === selectedModel),
      [models, selectedModel]
    )

    // Group models by category
    const groupedModels = useMemo(
      () =>
        models.reduce(
          (acc, model) => {
            const category = model.category || t('Other')
            if (!acc[category]) {
              acc[category] = []
            }
            acc[category].push(model)
            return acc
          },
          {} as Record<string, ModelOption[]>
        ),
      [models, t]
    )

    // Filter models by search query
    const filteredModels = useMemo(() => {
      if (!searchQuery.trim()) return groupedModels

      const query = searchQuery.toLowerCase()
      const filtered: Record<string, ModelOption[]> = {}

      Object.entries(groupedModels).forEach(([category, categoryModels]) => {
        const matches = categoryModels.filter(
          (m) =>
            m.label.toLowerCase().includes(query) ||
            m.value.toLowerCase().includes(query) ||
            m.description?.toLowerCase().includes(query)
        )
        if (matches.length > 0) {
          filtered[category] = matches
        }
      })

      return filtered
    }, [groupedModels, searchQuery])

    const handleModelChange = useCallback(
      (value: string) => {
        onModelChange(value)
        setOpen(false)
        setSearchQuery('')
      },
      [onModelChange]
    )

    // Shared command content
    const renderModelCommandContent = () => (
      <Command
        className={cn(
          isMobile
            ? 'h-full flex-1 rounded-lg border-0 bg-transparent'
            : 'rounded-lg'
        )}
        filter={() => 1}
        shouldFilter={false}
      >
        {!isMobile && (
          <CommandInput
            placeholder={t('Search models...')}
            className='h-9'
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
        )}
        <CommandEmpty>{t('No model found.')}</CommandEmpty>
        <CommandList
          className={isMobile ? '!max-h-full flex-1 p-2' : 'max-h-[300px]'}
        >
          {Object.keys(filteredModels).length === 0 ? (
            <div className='text-muted-foreground px-3 py-6 text-xs'>
              {t('No model found.')}
            </div>
          ) : (
            Object.entries(filteredModels).map(
              ([category, categoryModels], categoryIndex) => (
                <CommandGroup key={category}>
                  {categoryIndex > 0 && (
                    <div className='border-border my-1 border-t' />
                  )}
                  <div
                    className={cn(
                      'text-muted-foreground px-2 py-1 font-medium',
                      isMobile ? 'text-xs' : 'text-[10px]'
                    )}
                  >
                    {t('{{category}} Models', { category })}
                  </div>
                  {categoryModels.map((model) => (
                    <CommandItem
                      key={model.value}
                      value={model.value}
                      onSelect={handleModelChange}
                      className={cn(
                        'mb-0.5 flex items-center justify-between rounded-lg px-2 py-1.5 text-xs',
                        'transition-all duration-200',
                        'hover:bg-accent',
                        'data-[selected=true]:bg-accent'
                      )}
                    >
                      <div className='flex min-w-0 flex-1 items-center gap-1'>
                        <div
                          className={cn(
                            'truncate font-medium',
                            isMobile ? 'text-sm' : 'text-[11px]'
                          )}
                        >
                          <span className='inline'>{model.label}</span>
                        </div>
                        <Check
                          className={cn(
                            'h-4 w-4 flex-shrink-0',
                            selectedModel === model.value
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            )
          )}
        </CommandList>
      </Command>
    )

    return isMobile ? (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <ModelTriggerButton
            currentLabel={currentModel?.label || t('Model')}
            triggerClassName={className}
            isDisabled={disabled}
            aria-expanded={open}
          />
        </DrawerTrigger>
        <DrawerContent className='flex max-h-[80vh] min-h-[60vh] flex-col'>
          <DrawerHeader className='flex-shrink-0 pb-4'>
            <DrawerTitle className='flex items-center gap-2 text-left text-lg font-medium'>
              {t('Select Model')}
            </DrawerTitle>
          </DrawerHeader>
          <div className='flex min-h-0 flex-1 flex-col'>
            {renderModelCommandContent()}
          </div>
        </DrawerContent>
      </Drawer>
    ) : (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <ModelTriggerButton
              currentLabel={currentModel?.label || t('Model')}
              triggerClassName={className}
              isDisabled={disabled}
              aria-expanded={open}
            />
          }
        />
        <PopoverContent
          className='bg-popover z-40 w-[90vw] max-w-[20em] rounded-lg border p-0 !shadow-none sm:w-[20em]'
          align='start'
          side='bottom'
          sideOffset={4}
          collisionPadding={8}
        >
          {renderModelCommandContent()}
        </PopoverContent>
      </Popover>
    )
  }
)

ModelSelector.displayName = 'ModelSelector'

// Export combined selector component
export interface ModelGroupSelectorProps {
  selectedModel: string
  models: ModelOption[]
  onModelChange: (value: string) => void
  className?: string
  disabled?: boolean
}

/**
 * Model selector used by Playground.
 */
export const ModelGroupSelector: React.FC<ModelGroupSelectorProps> = ({
  selectedModel,
  models,
  onModelChange,
  className,
  disabled = false,
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryTab, setCategoryTab] = useState<ModelCategoryTab>('all')
  const [sortMode, setSortMode] = useState<ModelSortMode>('catalog')
  const isMobile = useIsMobile()
  const selectedModelOptionRef = useRef<HTMLButtonElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const currentModel = useMemo(
    () => models.find((model) => model.value === selectedModel),
    [models, selectedModel]
  )

  const filteredModels = useMemo(
    () =>
      filterPlaygroundModels(models, {
        categoryTab,
        searchQuery,
        sortMode,
      }),
    [categoryTab, models, searchQuery, sortMode]
  )

  const handleModelChange = useCallback(
    (value: string) => {
      onModelChange(value)
      setOpen(false)
      setSearchQuery('')
    },
    [onModelChange]
  )

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSearchQuery('')
    }
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    let secondFrameId = 0
    const firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        scrollSelectedOptionIntoView(
          selectedModelOptionRef.current,
          listRef.current
        )
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrameId)
      window.cancelAnimationFrame(secondFrameId)
    }
  }, [open, selectedModel, filteredModels.length])

  const categoryTabs: { id: ModelCategoryTab; label: string }[] = [
    { id: 'all', label: t('All') },
    { id: 'text', label: t('Text') },
    { id: 'image', label: t('Image') },
  ]

  const renderTrigger = () => (
    <Button
      aria-expanded={open}
      className={cn(
        'text-foreground h-8 max-w-full min-w-0 justify-start gap-2 border-0 px-1 font-normal shadow-none',
        'bg-transparent hover:bg-muted/60',
        'focus-visible:ring-0 focus-visible:ring-offset-0',
        className
      )}
      disabled={disabled}
      role='combobox'
      size='sm'
      type='button'
      variant='ghost'
    >
      <ModelSelectorIcon
        icon={currentModel?.icon}
        label={currentModel?.label || currentModel?.value}
        size={20}
      />
      <span className='min-w-0 truncate text-sm leading-5'>
        {formatModelSelectorTriggerLabel(currentModel, t('Model'))}
      </span>
      <ChevronDown
        className={cn(
          'text-muted-foreground size-3.5 shrink-0 opacity-70 transition-transform',
          open && 'rotate-180'
        )}
      />
    </Button>
  )

  const renderPanel = () => (
    <div className={zenmuxModelPanelClasses.panel}>
      <div className={zenmuxModelPanelClasses.toolbar}>
        <div className={zenmuxModelPanelClasses.searchWrap}>
          <Search className={zenmuxModelPanelClasses.searchIcon} />
          <input
            className={zenmuxModelPanelClasses.searchInput}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('Search models...')}
            type='search'
            value={searchQuery}
          />
        </div>
        <Button
          className={zenmuxModelPanelClasses.sortButton}
          onClick={() =>
            setSortMode((current) => (current === 'catalog' ? 'name' : 'catalog'))
          }
          size='sm'
          type='button'
          variant='outline'
        >
          <ArrowUpDown className='size-3.5 opacity-60' />
          {sortMode === 'catalog' ? t('Latest') : t('Name')}
        </Button>
      </div>

      <div className={zenmuxModelPanelClasses.tabsWrap}>
        {categoryTabs.map((tab) => (
          <button
            className={cn(
              zenmuxModelPanelClasses.tabButton,
              categoryTab === tab.id
                ? zenmuxModelPanelClasses.tabActive
                : zenmuxModelPanelClasses.tabInactive
            )}
            key={tab.id}
            onClick={() => setCategoryTab(tab.id)}
            type='button'
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={zenmuxModelPanelClasses.list} ref={listRef}>
        {filteredModels.length === 0 ? (
          <div className={zenmuxModelPanelClasses.empty}>
            {t('No model found.')}
          </div>
        ) : (
          filteredModels.map((model) => {
            const isSelected = selectedModel === model.value
            return (
              <button
                className={cn(
                  zenmuxModelPanelClasses.listItem,
                  isSelected && zenmuxModelPanelClasses.listItemActive
                )}
                key={model.value}
                onClick={() => handleModelChange(model.value)}
                ref={isSelected ? selectedModelOptionRef : undefined}
                type='button'
              >
                <ModelSelectorIcon
                  icon={model.icon}
                  label={model.label || model.value}
                  size={20}
                />
                <span className={zenmuxModelPanelClasses.listItemLabel}>
                  {formatModelSelectorListLabel(model, model.value)}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )

  return isMobile ? (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{renderTrigger()}</DrawerTrigger>
      <DrawerContent className='flex max-h-[85vh] flex-col rounded-t-2xl'>
        <DrawerHeader className='pb-2 text-left'>
          <DrawerTitle>{t('Select Model')}</DrawerTitle>
        </DrawerHeader>
        <div className='min-h-0 flex-1 overflow-hidden px-3 pb-5'>
          {renderPanel()}
        </div>
      </DrawerContent>
    </Drawer>
  ) : (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={renderTrigger()} />
      <PopoverContent
        align='start'
        className='w-auto border-0 bg-transparent p-0 shadow-none'
        collisionPadding={8}
        side='bottom'
        sideOffset={6}
      >
        {renderPanel()}
      </PopoverContent>
    </Popover>
  )
}
