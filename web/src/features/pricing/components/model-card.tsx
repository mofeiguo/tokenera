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
  memo,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Card } from '@/components/ui/card'
import { TooltipProvider } from '@/components/ui/tooltip'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

import { DEFAULT_TOKEN_UNIT } from '../constants'
import { formatCatalogTokenCount } from '../lib/catalog-signals'
import {
  getDynamicDisplayGroupRatio,
  getDynamicPricingSummary,
} from '../lib/dynamic-price'
import { isTokenBasedModel } from '../lib/model-helpers'
import { formatPrice, formatRequestPrice } from '../lib/price'
import type { PricingModel, TokenUnit } from '../types'
import { CatalogCapabilityChips } from './catalog-capability-chips'

export interface ModelCardProps {
  model: PricingModel
  onClick: () => void
  priceRate?: number
  usdExchangeRate?: number
  tokenUnit?: TokenUnit
  showRechargePrice?: boolean
  selectedGroup?: string
}

function PriceStat(props: { label: string; value: string }) {
  return (
    <div className='min-w-0'>
      <div className='text-muted-foreground truncate text-[11px]'>
        {props.label}
      </div>
      <div className='mt-0.5 truncate font-mono text-sm font-semibold tabular-nums'>
        {props.value}
      </div>
    </div>
  )
}

export const ModelCard = memo(function ModelCard(props: ModelCardProps) {
  const { t } = useTranslation()
  const tokenUnit = props.tokenUnit ?? DEFAULT_TOKEN_UNIT
  const priceRate = props.priceRate ?? 1
  const usdExchangeRate = props.usdExchangeRate ?? 1
  const showRechargePrice = props.showRechargePrice ?? false
  const isTokenBased = isTokenBasedModel(props.model)
  const tokenUnitLabel = tokenUnit === 'K' ? '1K' : '1M'
  const vendorIconKey = props.model.icon || props.model.vendor_icon
  const vendorIcon = vendorIconKey ? getLobeIcon(vendorIconKey, 28) : null
  const vendorName = props.model.vendor_name || t('Unknown')
  const initial = props.model.model_name?.charAt(0).toUpperCase() || '?'
  const contextLength = formatCatalogTokenCount(props.model.context_length)
  const maxOutput = formatCatalogTokenCount(props.model.max_output_tokens)
  const isDynamicPricing =
    props.model.billing_mode === 'tiered_expr' &&
    Boolean(props.model.billing_expr)
  const dynamicSummary = isDynamicPricing
    ? getDynamicPricingSummary(props.model, {
        tokenUnit,
        showRechargePrice,
        priceRate,
        usdExchangeRate,
        groupRatioMultiplier: getDynamicDisplayGroupRatio(
          props.model,
          props.selectedGroup
        ),
      })
    : null

  const metaParts = [vendorName]
  if (contextLength) metaParts.push(contextLength)
  if (maxOutput) metaParts.push(`${t('Max output')} ${maxOutput}`)

  const cacheReadEntry = dynamicSummary?.entries.find(
    (entry) => entry.field === 'cacheReadPrice'
  )
  const hasCachePrice =
    Boolean(cacheReadEntry) || (isTokenBased && props.model.cache_ratio != null)

  let priceSummary: ReactNode
  if (dynamicSummary) {
    if (
      !dynamicSummary.isSpecialExpression &&
      dynamicSummary.primaryEntries.length > 0
    ) {
      const cardEntries = [...dynamicSummary.primaryEntries]
      if (cacheReadEntry) {
        const outputIndex = cardEntries.findIndex(
          (entry) => entry.field === 'outputPrice'
        )
        cardEntries.splice(
          outputIndex === -1 ? cardEntries.length : outputIndex,
          0,
          cacheReadEntry
        )
      }
      priceSummary = (
        <div
          className={cn(
            'grid gap-3',
            cardEntries.length > 2 ? 'grid-cols-3' : 'grid-cols-2'
          )}
        >
          {cardEntries.map((entry) => (
            <PriceStat
              key={entry.key}
              label={t(entry.shortLabel)}
              value={entry.formatted}
            />
          ))}
        </div>
      )
    } else {
      priceSummary = (
        <div className='text-sm font-medium'>
          {dynamicSummary.isSpecialExpression
            ? t('Special billing expression')
            : t('Dynamic Pricing')}
        </div>
      )
    }
  } else if (isTokenBased) {
    priceSummary = (
      <div
        className={cn(
          'grid gap-3',
          hasCachePrice ? 'grid-cols-3' : 'grid-cols-2'
        )}
      >
        <PriceStat
          label={`${t('Input')} / ${tokenUnitLabel}`}
          value={formatPrice(
            props.model,
            'input',
            tokenUnit,
            showRechargePrice,
            priceRate,
            usdExchangeRate,
            props.selectedGroup
          )}
        />
        {hasCachePrice ? (
          <PriceStat
            label={`${t('Cached')} / ${tokenUnitLabel}`}
            value={formatPrice(
              props.model,
              'cache',
              tokenUnit,
              showRechargePrice,
              priceRate,
              usdExchangeRate,
              props.selectedGroup
            )}
          />
        ) : null}
        <PriceStat
          label={`${t('Output')} / ${tokenUnitLabel}`}
          value={formatPrice(
            props.model,
            'output',
            tokenUnit,
            showRechargePrice,
            priceRate,
            usdExchangeRate,
            props.selectedGroup
          )}
        />
      </div>
    )
  } else {
    priceSummary = (
      <PriceStat
        label={t('Per Request')}
        value={formatRequestPrice(
          props.model,
          showRechargePrice,
          priceRate,
          usdExchangeRate,
          props.selectedGroup
        )}
      />
    )
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      props.onClick()
    }
  }

  const handleCopyClick = (event: MouseEvent) => {
    event.stopPropagation()
  }

  return (
    <TooltipProvider>
      <Card
        role='link'
        tabIndex={0}
        aria-label={`${t('Details')}: ${props.model.model_name}`}
        onClick={props.onClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'group relative h-full min-h-44 cursor-pointer gap-0 overflow-hidden py-0 shadow-xs transition-[border-color,box-shadow] duration-150',
          'hover:border-foreground/20 hover:shadow-sm',
          'focus-visible:ring-ring/40 focus-visible:ring-2 focus-visible:outline-none'
        )}
      >
        <div className='flex h-full flex-col px-4 pt-4 pb-4 sm:px-5 sm:pt-5 sm:pb-5'>
          <div className='flex items-start gap-3'>
            <div className='bg-muted/50 ring-border/60 flex size-10 shrink-0 items-center justify-center rounded-lg ring-1'>
              {vendorIcon || (
                <span className='text-muted-foreground text-sm font-semibold'>
                  {initial}
                </span>
              )}
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-1'>
                <h2 className='min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight'>
                  {props.model.model_name}
                </h2>
                <div
                  className='shrink-0'
                  onClick={handleCopyClick}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <CopyButton
                    value={props.model.model_name || ''}
                    className='text-muted-foreground/70 hover:text-foreground size-8'
                    iconClassName='size-3.5'
                    tooltip={t('Copy model name')}
                    successTooltip={t('Copied!')}
                    aria-label={t('Copy model name')}
                  />
                </div>
              </div>
              <p className='text-muted-foreground/80 mt-0.5 truncate text-xs'>
                {metaParts.join(' · ')}
              </p>
            </div>
          </div>

          <CatalogCapabilityChips
            model={props.model}
            compact
            className='mt-3 min-h-6'
          />

          <div className='border-border/60 mt-auto border-t pt-4'>
            {priceSummary}
          </div>
        </div>
      </Card>
    </TooltipProvider>
  )
})
