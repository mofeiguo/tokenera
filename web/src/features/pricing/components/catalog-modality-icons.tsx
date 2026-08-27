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
import { FileText, Image as ImageIcon, Video, Volume2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import type { Modality } from '../types'

const MODALITY_LABEL_KEYS: Record<Modality, string> = {
  text: 'Text',
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
  file: 'File',
}

const MODALITY_ORDER: Modality[] = ['file', 'image', 'text', 'audio', 'video']

const MODALITY_STYLE: Record<Modality, string> = {
  text: 'bg-blue-500/10 text-blue-600',
  image: 'bg-green-500/10 text-green-600',
  file: 'bg-amber-500/10 text-amber-600',
  audio: 'bg-rose-500/10 text-rose-600',
  video: 'bg-violet-500/10 text-violet-600',
}

function isCatalogModality(value: string): value is Modality {
  return value in MODALITY_LABEL_KEYS
}

function orderCatalogModalities(items: readonly string[]): string[] {
  return [...items].sort((left, right) => {
    const leftRank = isCatalogModality(left)
      ? MODALITY_ORDER.indexOf(left)
      : MODALITY_ORDER.length
    const rightRank = isCatalogModality(right)
      ? MODALITY_ORDER.indexOf(right)
      : MODALITY_ORDER.length
    return leftRank - rightRank
  })
}

function ModalityGlyph(props: { modality: string }) {
  if (props.modality === 'text') {
    return (
      <span className='text-[13px] leading-none font-semibold' aria-hidden>
        T
      </span>
    )
  }
  if (props.modality === 'image') {
    return <ImageIcon className='size-3.5' aria-hidden />
  }
  if (props.modality === 'file') {
    return <FileText className='size-3.5' aria-hidden />
  }
  if (props.modality === 'audio') {
    return <Volume2 className='size-3.5' aria-hidden />
  }
  if (props.modality === 'video') {
    return <Video className='size-3.5' aria-hidden />
  }
  return (
    <span className='text-[10px] leading-none font-medium' aria-hidden>
      {props.modality.slice(0, 1).toUpperCase()}
    </span>
  )
}

function ModalityTile(props: { modality: string; roleLabel: string }) {
  const { t } = useTranslation()
  const name = isCatalogModality(props.modality)
    ? t(MODALITY_LABEL_KEYS[props.modality])
    : props.modality
  const label = `${props.roleLabel} · ${name}`
  const tone = isCatalogModality(props.modality)
    ? MODALITY_STYLE[props.modality]
    : 'bg-muted text-muted-foreground'

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            role='img'
            aria-label={label}
            className={cn(
              'inline-flex size-8 cursor-help items-center justify-center rounded-lg',
              tone
            )}
          >
            <ModalityGlyph modality={props.modality} />
          </div>
        }
      />
      <TooltipContent side='top' className='text-xs'>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export function CatalogModalityFlow(props: {
  input: readonly string[]
  output: readonly string[]
  className?: string
}) {
  const { t } = useTranslation()
  const input = orderCatalogModalities(props.input)
  const output = orderCatalogModalities(props.output)
  const inputLabel = t('Input')
  const outputLabel = t('Output')

  if (input.length === 0 && output.length === 0) return null

  return (
    <TooltipProvider>
      <div
        data-slot='catalog-modality-flow'
        className={cn('flex flex-wrap items-center gap-2', props.className)}
      >
        {input.map((modality) => (
          <ModalityTile
            key={`input:${modality}`}
            modality={modality}
            roleLabel={inputLabel}
          />
        ))}
        {input.length > 0 && output.length > 0 ? (
          <span className='text-muted-foreground/50 px-0.5' aria-hidden>
            →
          </span>
        ) : null}
        {output.map((modality) => (
          <ModalityTile
            key={`output:${modality}`}
            modality={modality}
            roleLabel={outputLabel}
          />
        ))}
      </div>
    </TooltipProvider>
  )
}
