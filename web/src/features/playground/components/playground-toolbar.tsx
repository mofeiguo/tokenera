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
import { Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ModelGroupSelector } from '@/components/model-group-selector'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import {
  getModelEndpointTypes,
  PLAYGROUND_TOOLBAR,
  PLAYGROUND_TOOLBAR_ICON_BUTTON,
  PLAYGROUND_TOOLBAR_INNER,
  PLAYGROUND_TOOLBAR_MODEL,
} from '../lib'
import type {
  ModelOption,
  ParameterEnabled,
  PlaygroundConfig,
  PlaygroundEndpointType,
} from '../types'
import { PlaygroundParameterPanel } from './input/playground-parameter-panel'

type PlaygroundToolbarProps = {
  config: PlaygroundConfig
  disabled?: boolean
  endpointValue: PlaygroundEndpointType
  hasMessages?: boolean
  isModelLoading?: boolean
  models: ModelOption[]
  modelValue: string
  onClearMessages?: () => void
  onConfigChange: <K extends keyof PlaygroundConfig>(
    key: K,
    value: PlaygroundConfig[K]
  ) => void
  onEndpointChange: (value: PlaygroundEndpointType) => void
  onModelChange: (value: string) => void
  onParameterEnabledChange: (
    key: keyof ParameterEnabled,
    value: boolean
  ) => void
  parameterEnabled: ParameterEnabled
}

export function PlaygroundToolbar(props: PlaygroundToolbarProps) {
  const { t } = useTranslation()
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const endpointTypes = getModelEndpointTypes(props.models, props.modelValue)
  const selectorDisabled = props.disabled || props.isModelLoading

  const handleClearMessages = () => {
    props.onClearMessages?.()
    setClearConfirmOpen(false)
    toast.success(t('Conversation cleared'))
  }

  return (
    <>
      <div className={PLAYGROUND_TOOLBAR}>
        <div className={PLAYGROUND_TOOLBAR_INNER}>
          <ModelGroupSelector
            className={PLAYGROUND_TOOLBAR_MODEL}
            disabled={selectorDisabled}
            models={props.models}
            onModelChange={props.onModelChange}
            selectedModel={props.modelValue}
          />

          <div className='flex shrink-0 items-center gap-0.5'>
            <PlaygroundParameterPanel
              config={props.config}
              disabled={props.disabled}
              endpointTypes={endpointTypes}
              endpointValue={props.endpointValue}
              isModelLoading={props.isModelLoading}
              modelValue={props.modelValue}
              models={props.models}
              onConfigChange={props.onConfigChange}
              onEndpointChange={props.onEndpointChange}
              onParameterEnabledChange={props.onParameterEnabledChange}
              parameterEnabled={props.parameterEnabled}
              variant='toolbar'
            />

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label={t('Clear chat history')}
                    className={cn(
                      PLAYGROUND_TOOLBAR_ICON_BUTTON,
                      'hover:text-destructive hover:bg-destructive/10'
                    )}
                    disabled={
                      props.disabled ||
                      !props.hasMessages ||
                      !props.onClearMessages
                    }
                    onClick={() => setClearConfirmOpen(true)}
                    size='icon'
                    type='button'
                    variant='ghost'
                  >
                    <Trash2Icon className='size-[18px]' />
                  </Button>
                }
              />
              <TooltipContent>
                <p>{t('Clear chat history')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <ConfirmDialog
        destructive
        desc={t(
          'All playground messages saved in this browser will be removed. This cannot be undone.'
        )}
        confirmText={t('Clear')}
        handleConfirm={handleClearMessages}
        open={clearConfirmOpen}
        onOpenChange={setClearConfirmOpen}
        title={t('Clear chat history?')}
      />
    </>
  )
}
