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
import { SlidersHorizontalIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  formatModelSelectorTriggerLabel,
  ModelSelectorIcon,
} from '@/components/model-group-selector/model-display'
import { PromptInputButton } from '@/components/ai-elements/prompt-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

import { PlaygroundProtocolSelector } from '../playground-protocol-selector'
import {
  getParameterControlValueText,
  normalizeParameterNumberValue,
  PLAYGROUND_PARAMETER_CONTROLS,
  PLAYGROUND_PARAMETER_PANEL_SCROLL_CLASS,
  type PlaygroundParameterKey,
} from '../../lib/parameters/playground-parameters'
import {
  PLAYGROUND_INPUT_TOOL_BUTTON,
  PLAYGROUND_TOOLBAR_ICON_BUTTON,
} from '../../lib/playground-surface'
import type {
  ModelOption,
  ParameterEnabled,
  PlaygroundConfig,
  PlaygroundEndpointType,
} from '../../types'

type PlaygroundParameterPanelProps = {
  config: PlaygroundConfig
  disabled?: boolean
  endpointTypes: PlaygroundEndpointType[]
  endpointValue: PlaygroundEndpointType
  isModelLoading?: boolean
  modelValue: string
  models: ModelOption[]
  onConfigChange: <K extends keyof PlaygroundConfig>(
    key: K,
    value: PlaygroundConfig[K]
  ) => void
  onEndpointChange: (value: PlaygroundEndpointType) => void
  onParameterEnabledChange: (
    key: PlaygroundParameterKey,
    value: boolean
  ) => void
  parameterEnabled: ParameterEnabled
  variant?: 'composer' | 'toolbar'
}

type PlaygroundParameterContentProps = PlaygroundParameterPanelProps & {
  compact?: boolean
}

function PlaygroundParameterPanelHeader({
  modelValue,
  models,
}: Pick<PlaygroundParameterPanelProps, 'modelValue' | 'models'>) {
  const { t } = useTranslation()
  const selectedModel = models.find((model) => model.value === modelValue)

  return (
    <div className='flex min-w-0 items-center gap-2 px-1'>
      <ModelSelectorIcon
        icon={selectedModel?.icon}
        label={selectedModel?.label ?? modelValue}
        size={18}
      />
      <div className='min-w-0 truncate text-sm font-semibold'>
        {formatModelSelectorTriggerLabel(selectedModel, t('Model'))}
      </div>
    </div>
  )
}

function PlaygroundParameterContent({
  compact = false,
  config,
  disabled,
  endpointTypes,
  endpointValue,
  isModelLoading,
  onConfigChange,
  onEndpointChange,
  onParameterEnabledChange,
  parameterEnabled,
}: PlaygroundParameterContentProps) {
  const { t } = useTranslation()
  const selectorDisabled = disabled || isModelLoading

  const updateParameterConfig = (
    key: PlaygroundParameterKey,
    value: number | null
  ) => {
    if (key === 'seed') {
      onConfigChange('seed', value)
      return
    }

    onConfigChange(key, value ?? 0)
  }

  return (
    <div
      className={cn(
        'grid gap-4',
        PLAYGROUND_PARAMETER_PANEL_SCROLL_CLASS,
        compact ? 'px-4 pb-4' : 'p-1'
      )}
    >
      {endpointTypes.length > 0 ? (
        <PlaygroundProtocolSelector
          disabled={selectorDisabled}
          endpointTypes={endpointTypes}
          onChange={onEndpointChange}
          value={endpointValue}
        />
      ) : null}

      {PLAYGROUND_PARAMETER_CONTROLS.map((control) => {
        const enabled = parameterEnabled[control.key]
        const value = config[control.key]
        const controlId = `playground-${control.key}`

        return (
          <div
            className={cn(
              'border-border/70 bg-background/60 grid gap-2 rounded-lg border p-3 transition-opacity',
              (!enabled || disabled) && 'opacity-55'
            )}
            key={control.key}
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0 space-y-1'>
                <div className='flex min-w-0 items-center gap-2'>
                  <label
                    className='truncate text-sm leading-5 font-medium'
                    htmlFor={controlId}
                  >
                    {t(control.labelKey)}
                  </label>
                  <Badge
                    className='h-5 max-w-24 shrink-0 px-1.5 font-mono text-[11px]'
                    variant='outline'
                  >
                    {t(getParameterControlValueText(control.key, value))}
                  </Badge>
                </div>
                <p className='text-muted-foreground text-xs leading-4'>
                  {t(control.descriptionKey)}
                </p>
              </div>

              <Switch
                aria-label={t('Enable {{parameter}}', {
                  parameter: t(control.labelKey),
                })}
                checked={enabled}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  onParameterEnabledChange(control.key, checked)
                }
                size='sm'
              />
            </div>

            {control.valueType === 'slider' ? (
              <Slider
                className='py-1.5'
                disabled={disabled || !enabled}
                id={controlId}
                max={control.max}
                min={control.min}
                onValueChange={(nextValue) => {
                  const firstValue = Array.isArray(nextValue)
                    ? nextValue[0]
                    : nextValue
                  updateParameterConfig(
                    control.key,
                    normalizeParameterNumberValue(control.key, firstValue)
                  )
                }}
                step={control.step}
                value={[Number(value)]}
              />
            ) : (
              <Input
                disabled={disabled || !enabled}
                id={controlId}
                inputMode='numeric'
                max={control.max}
                min={control.min}
                onChange={(event) => {
                  updateParameterConfig(
                    control.key,
                    normalizeParameterNumberValue(
                      control.key,
                      event.target.value
                    )
                  )
                }}
                step={control.step}
                type='number'
                value={value ?? ''}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function PlaygroundParameterPanel(props: PlaygroundParameterPanelProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const variant = props.variant ?? 'composer'
  const activeCount = PLAYGROUND_PARAMETER_CONTROLS.filter(
    (control) => props.parameterEnabled[control.key]
  ).length

  const badge =
    activeCount > 0 ? (
      <span className='bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] leading-none font-semibold'>
        {activeCount}
      </span>
    ) : null

  const trigger =
    variant === 'toolbar' ? (
      <Button
        aria-label={t('Parameters')}
        className={cn(PLAYGROUND_TOOLBAR_ICON_BUTTON, 'relative')}
        disabled={props.disabled}
        size='icon'
        type='button'
        variant='ghost'
      >
        <SlidersHorizontalIcon className='size-[18px]' />
        {badge}
      </Button>
    ) : (
      <PromptInputButton
        aria-label={t('Parameters')}
        className={cn(PLAYGROUND_INPUT_TOOL_BUTTON, 'relative')}
        disabled={props.disabled}
        variant='ghost'
      >
        <SlidersHorizontalIcon size={16} />
        {badge}
      </PromptInputButton>
    )

  if (isMobile) {
    return (
      <Sheet>
        <Tooltip>
          <TooltipTrigger render={<SheetTrigger render={trigger} />} />
          <TooltipContent>
            <p>{t('Parameters')}</p>
          </TooltipContent>
        </Tooltip>
        <SheetContent
          className='max-h-[85vh] overflow-hidden rounded-t-xl'
          side='bottom'
        >
          <SheetHeader>
            <SheetTitle className='sr-only'>{t('Parameter settings')}</SheetTitle>
            <PlaygroundParameterPanelHeader
              modelValue={props.modelValue}
              models={props.models}
            />
          </SheetHeader>
          <PlaygroundParameterContent {...props} compact />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger render={<PopoverTrigger render={trigger} />} />
        <TooltipContent>
          <p>{t('Parameters')}</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        align='end'
        className='w-[min(24rem,calc(100vw-2rem))] gap-4 p-4'
        collisionPadding={8}
        side='bottom'
        sideOffset={8}
      >
        <PlaygroundParameterPanelHeader
          modelValue={props.modelValue}
          models={props.models}
        />
        <PlaygroundParameterContent {...props} />
      </PopoverContent>
    </Popover>
  )
}
