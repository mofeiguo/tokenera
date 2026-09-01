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
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import {
  MODEL_CAPABILITY_LABEL_KEYS,
  getModelCapabilityKeys,
  type ModelCapabilityKey,
} from '../lib/model-capabilities'
import type { Model } from '../types'

const MODEL_CAPABILITY_ICONS: Record<
  ModelCapabilityKey,
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

type ModelCapabilityChipsProps = {
  model: Pick<Model, 'capabilities' | 'input_modalities' | 'output_modalities'>
  className?: string
}

export function ModelCapabilityChips(props: ModelCapabilityChipsProps) {
  const { t } = useTranslation()
  const keys = getModelCapabilityKeys(props.model)

  if (keys.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-1.5', props.className)}>
      {keys.map((key) => {
        const label = t(MODEL_CAPABILITY_LABEL_KEYS[key])
        const style = MODEL_CAPABILITY_ICONS[key]
        const Icon = style.icon

        return (
          <Tooltip key={key}>
            <TooltipTrigger
              render={
                <div className='bg-muted/50 text-muted-foreground hover:bg-muted inline-flex size-6 cursor-help items-center justify-center rounded-md border border-transparent' />
              }
            >
              <Icon size={12} className={style.color} />
            </TooltipTrigger>
            <TooltipContent side='top' className='text-xs'>
              {label}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
