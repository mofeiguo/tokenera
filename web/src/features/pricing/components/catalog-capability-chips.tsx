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
  Boxes,
  Braces,
  Code2,
  Database,
  Eye,
  FileJson2,
  Globe,
  ImagePlus,
  MessageSquare,
  Video,
  Volume2,
  Wrench,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import {
  CATALOG_CAPABILITY_LABEL_KEYS,
  getCatalogCapabilityKeys,
  type CatalogCapabilityKey,
} from '../lib/catalog-signals'
import type { PricingModel } from '../types'

const CATALOG_CAPABILITY_ICONS: Record<
  CatalogCapabilityKey,
  { icon: typeof Eye; color: string }
> = {
  vision: { icon: Eye, color: 'text-green-500' },
  image_generation: { icon: ImagePlus, color: 'text-pink-500' },
  video_generation: { icon: Video, color: 'text-violet-500' },
  speech_generation: { icon: Volume2, color: 'text-rose-500' },
  tools: { icon: Wrench, color: 'text-purple-500' },
  reasoning: { icon: MessageSquare, color: 'text-orange-500' },
  json_mode: { icon: Braces, color: 'text-cyan-500' },
  structured_output: { icon: FileJson2, color: 'text-teal-500' },
  web_search: { icon: Globe, color: 'text-sky-500' },
  code_interpreter: { icon: Code2, color: 'text-blue-500' },
  caching: { icon: Database, color: 'text-amber-500' },
  embeddings: { icon: Boxes, color: 'text-indigo-500' },
}

export interface CatalogCapabilityChipsProps {
  model: Pick<
    PricingModel,
    'capabilities' | 'input_modalities' | 'output_modalities'
  >
  compact?: boolean
  className?: string
}

export function CatalogCapabilityChips(props: CatalogCapabilityChipsProps) {
  const { t } = useTranslation()
  const keys = getCatalogCapabilityKeys(props.model)

  if (keys.length === 0) return null

  return (
    <TooltipProvider>
      <div className={cn('flex flex-wrap gap-1.5', props.className)}>
        {keys.map((key) => {
          const label = t(CATALOG_CAPABILITY_LABEL_KEYS[key])
          const style = CATALOG_CAPABILITY_ICONS[key]
          const Icon = style.icon

          return (
            <Tooltip key={key}>
              <TooltipTrigger
                render={
                  <div
                    className={cn(
                      'bg-muted/50 text-muted-foreground hover:border-border/50 hover:bg-muted inline-flex cursor-help items-center rounded-md border border-transparent font-medium transition-colors',
                      props.compact
                        ? 'size-6 justify-center'
                        : 'gap-1 px-2 py-1 text-[11px]'
                    )}
                  >
                    <Icon size={12} className={style.color} />
                    {props.compact ? null : label}
                  </div>
                }
              />
              <TooltipContent side='top' className='text-xs'>
                {t('Supports {{capability}}', { capability: label })}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
