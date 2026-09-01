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
import { ArrowLeft, Code2, Info, Maximize2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { sideDrawerContentClassName } from '@/components/drawer-layout'
import { PublicLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getLobeIcon } from '@/lib/lobe-icon'
import { useNavigate, useParams, useSearch } from '@/lib/router'
import { cn } from '@/lib/utils'

import { DEFAULT_TOKEN_UNIT } from '../constants'
import { usePricingData } from '../hooks/use-pricing-data'
import {
  formatCatalogTokenCount,
  getCatalogCapabilityKeys,
} from '../lib/catalog-signals'
import { getDynamicPricingSummary } from '../lib/dynamic-price'
import { isTokenBasedModel } from '../lib/model-helpers'
import { formatFixedPrice, formatGroupPrice } from '../lib/price'
import type { PriceType, PricingModel, TokenUnit } from '../types'
import { CatalogCapabilityChips } from './catalog-capability-chips'
import { CatalogModalityFlow } from './catalog-modality-icons'
import { DynamicPricingBreakdown } from './dynamic-pricing-breakdown'
import { ModelBillingModeBadge } from './model-billing-mode-badge'
import { ModelDetailsApi } from './model-details-api'

// ----------------------------------------------------------------------------
// Local UI helpers
// ----------------------------------------------------------------------------

function SectionTitle(props: { children: React.ReactNode }) {
  return (
    <h2 className='text-foreground text-sm font-semibold'>{props.children}</h2>
  )
}

function OverviewSheet(props: { children: React.ReactNode }) {
  return (
    <div className='divide-y overflow-hidden rounded-xl border'>
      {props.children}
    </div>
  )
}

const MODEL_DETAILS_SKELETON_KEYS = ['first', 'second', 'third', 'fourth']

function formatCatalogYearMonth(value?: string): string {
  if (!value) return ''
  const [yearStr, monthStr] = value.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return value
  const date = new Date(Date.UTC(year, month - 1, 1))
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short' })
}

function normalizeCatalogItems(items?: readonly string[]): string[] {
  if (!items) return []
  return items.filter((item) => item.trim().length > 0)
}

function SpecRow(props: { label: string; children: React.ReactNode }) {
  return (
    <div className='grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-4 px-4 py-3 sm:grid-cols-[9.5rem_minmax(0,1fr)]'>
      <dt className='text-muted-foreground pt-0.5 text-sm'>{props.label}</dt>
      <dd className='text-foreground min-w-0 text-sm font-medium'>
        {props.children}
      </dd>
    </div>
  )
}

function ModelModalitiesCard(props: { model: PricingModel }) {
  const { t } = useTranslation()
  const inputModalities = normalizeCatalogItems(props.model.input_modalities)
  const outputModalities = normalizeCatalogItems(props.model.output_modalities)

  if (inputModalities.length === 0 && outputModalities.length === 0) {
    return null
  }

  return (
    <section
      data-slot='model-overview-modalities'
      className='flex flex-col gap-3 rounded-xl border px-4 py-3'
    >
      <h2 className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
        {t('Modalities')}
      </h2>
      <CatalogModalityFlow input={inputModalities} output={outputModalities} />
    </section>
  )
}

function ModelOverviewSpecs(props: { model: PricingModel }) {
  const { t } = useTranslation()
  const model = props.model
  const contextLength = formatCatalogTokenCount(model.context_length)
  const maxOutput = formatCatalogTokenCount(model.max_output_tokens)
  const knowledgeCutoff = formatCatalogYearMonth(model.knowledge_cutoff)
  const releaseDate = formatCatalogYearMonth(model.release_date)
  const hasCapabilities = getCatalogCapabilityKeys(model).length > 0
  const rows: React.ReactNode[] = []

  if (hasCapabilities) {
    rows.push(
      <SpecRow key='capabilities' label={t('Model capabilities')}>
        <CatalogCapabilityChips model={model} />
      </SpecRow>
    )
  }

  if (contextLength) {
    rows.push(
      <SpecRow key='context' label={t('Context')}>
        <span className='font-mono tabular-nums'>{contextLength}</span>
      </SpecRow>
    )
  }

  if (maxOutput) {
    rows.push(
      <SpecRow key='max-output' label={t('Max output')}>
        <span className='font-mono tabular-nums'>{maxOutput}</span>
      </SpecRow>
    )
  }

  if (knowledgeCutoff) {
    rows.push(
      <SpecRow key='knowledge' label={t('Knowledge cutoff')}>
        {knowledgeCutoff}
      </SpecRow>
    )
  }

  if (releaseDate) {
    rows.push(
      <SpecRow key='release' label={t('Released')}>
        {releaseDate}
      </SpecRow>
    )
  }

  if (model.parameter_count) {
    rows.push(
      <SpecRow key='parameters' label={t('Parameters')}>
        {model.parameter_count}
      </SpecRow>
    )
  }

  if (rows.length === 0) return null

  return (
    <OverviewSheet>
      <dl data-slot='model-overview-specs' className='divide-y'>
        {rows}
      </dl>
    </OverviewSheet>
  )
}

// ----------------------------------------------------------------------------
// Model header (always visible above the detail sections)
// ----------------------------------------------------------------------------

function ModelHeader(props: {
  model: PricingModel
  sticky?: boolean
  onOpenFullPage?: () => void
}) {
  const { t } = useTranslation()
  const model = props.model
  const modelIconKey = model.icon || model.vendor_icon
  const modelIcon = modelIconKey ? getLobeIcon(modelIconKey, 28) : null
  const initial = model.model_name?.charAt(0).toUpperCase() || '?'

  return (
    <header
      className={cn(
        'pb-1',
        props.sticky &&
          'bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky top-0 z-20 -mx-4 border-b border-border/60 px-4 pt-4 pb-3 backdrop-blur-md sm:-mx-6 sm:px-6'
      )}
    >
      <div className='flex items-start gap-3'>
        <div className='bg-muted/50 ring-border/60 flex size-11 shrink-0 items-center justify-center rounded-xl ring-1'>
          {modelIcon || (
            <span className='text-muted-foreground text-sm font-semibold'>
              {initial}
            </span>
          )}
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-1'>
            <h1 className='min-w-0 truncate text-xl font-semibold tracking-tight'>
              {model.model_name}
            </h1>
            <CopyButton
              value={model.model_name || ''}
              className='size-7'
              iconClassName='size-3.5'
              tooltip={t('Copy model name')}
              successTooltip={t('Copied!')}
              aria-label={t('Copy model name')}
            />
            {props.onOpenFullPage ? (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={props.onOpenFullPage}
                className='ml-auto size-8'
                aria-label={t('Open full page')}
                title={t('Open full page')}
              >
                <Maximize2 className='size-4' />
              </Button>
            ) : null}
          </div>
          <div className='mt-1 flex flex-wrap items-center gap-1.5 text-sm'>
            {model.vendor_name ? (
              <>
                <span className='text-muted-foreground'>
                  {model.vendor_name}
                </span>
                <span className='text-muted-foreground/30'>·</span>
              </>
            ) : null}
            <ModelBillingModeBadge model={model} />
          </div>
        </div>
      </div>
    </header>
  )
}

// ----------------------------------------------------------------------------
// Base price card (used in the Overview tab)
// ----------------------------------------------------------------------------

function PriceCell(props: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex min-w-0 flex-col gap-1 px-4 py-4'>
      <div className='text-muted-foreground text-sm'>{props.label}</div>
      <div className='text-foreground font-mono text-lg font-semibold tracking-tight tabular-nums'>
        {props.children}
      </div>
    </div>
  )
}

function PriceExtraRow(props: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex items-baseline justify-between gap-4 px-4 py-2.5'>
      <span className='text-muted-foreground text-sm'>{props.label}</span>
      <span className='text-foreground font-mono text-sm tabular-nums'>
        {props.children}
      </span>
    </div>
  )
}

function PriceUnit(props: { unit: string }) {
  return (
    <span className='text-muted-foreground ml-1 text-xs font-normal'>
      / {props.unit}
    </span>
  )
}

function PriceSection(props: {
  model: PricingModel
  priceRate: number
  usdExchangeRate: number
  tokenUnit: TokenUnit
  showRechargePrice: boolean
}) {
  const { t } = useTranslation()
  const isTokenBased = isTokenBasedModel(props.model)
  const tokenUnitLabel = props.tokenUnit === 'K' ? '1K' : '1M'
  const baseGroupKey = '_base'
  const baseGroupRatioMap = { [baseGroupKey]: 1 }
  const dynamicSummary = getDynamicPricingSummary(props.model, {
    tokenUnit: props.tokenUnit,
    showRechargePrice: props.showRechargePrice,
    priceRate: props.priceRate,
    usdExchangeRate: props.usdExchangeRate,
    groupRatioMultiplier: 1,
  })

  const primaryPriceTypes: { label: string; type: PriceType }[] = [
    { label: t('Input'), type: 'input' },
  ]
  if (props.model.cache_ratio != null) {
    primaryPriceTypes.push({ label: t('Cached'), type: 'cache' })
  }
  primaryPriceTypes.push({ label: t('Output'), type: 'output' })
  const secondaryPriceTypes: {
    label: string
    type: PriceType
    available: boolean
  }[] = [
    {
      label: t('Cache write'),
      type: 'create_cache',
      available: props.model.create_cache_ratio != null,
    },
    {
      label: t('Image input'),
      type: 'image',
      available: props.model.image_ratio != null,
    },
    {
      label: t('Audio input'),
      type: 'audio_input',
      available: props.model.audio_ratio != null,
    },
    {
      label: t('Audio output'),
      type: 'audio_output',
      available:
        props.model.audio_ratio != null &&
        props.model.audio_completion_ratio != null,
    },
  ]

  if (dynamicSummary) {
    if (dynamicSummary.isSpecialExpression) {
      return (
        <section className='flex flex-col gap-3'>
          <SectionTitle>{t('Pricing')}</SectionTitle>
          <div className='border-warning/40 bg-warning/10 rounded-xl border p-4'>
            <div className='text-warning text-sm font-medium'>
              {t('Special billing expression')}
            </div>
            <p className='text-muted-foreground mt-1 text-sm'>
              {t('Unable to parse structured pricing')}
            </p>
            <code className='text-muted-foreground bg-background/80 mt-3 block max-h-28 overflow-auto rounded-md border px-2 py-1.5 font-mono text-xs break-all'>
              {dynamicSummary.rawExpression}
            </code>
          </div>
        </section>
      )
    }

    const cacheReadEntry = dynamicSummary.entries.find(
      (entry) => entry.field === 'cacheReadPrice'
    )
    const displayEntries = [...dynamicSummary.primaryEntries]
    if (cacheReadEntry) {
      const outputIndex = displayEntries.findIndex(
        (entry) => entry.field === 'outputPrice'
      )
      displayEntries.splice(
        outputIndex === -1 ? displayEntries.length : outputIndex,
        0,
        cacheReadEntry
      )
    }
    const extraEntries = dynamicSummary.secondaryEntries.filter(
      (entry) => entry.field !== 'cacheReadPrice'
    )

    return (
      <section
        className='flex flex-col gap-3'
        data-slot='model-overview-pricing'
      >
        <SectionTitle>{t('Pricing')}</SectionTitle>
        <OverviewSheet>
          {displayEntries.length > 0 ? (
            <div
              className={cn(
                'grid',
                displayEntries.length > 2
                  ? 'grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0'
                  : 'grid-cols-2 divide-x'
              )}
            >
              {displayEntries.map((entry) => (
                <PriceCell key={entry.key} label={t(entry.shortLabel)}>
                  {entry.formatted}
                  <PriceUnit unit={tokenUnitLabel} />
                </PriceCell>
              ))}
            </div>
          ) : (
            <p className='text-muted-foreground px-4 py-4 text-sm'>
              {t('Dynamic Pricing')}
            </p>
          )}
          {extraEntries.length > 0 ? (
            <div className='divide-border divide-y border-t'>
              {extraEntries.map((entry) => (
                <PriceExtraRow key={entry.key} label={t(entry.shortLabel)}>
                  {entry.formatted}
                  <PriceUnit unit={tokenUnitLabel} />
                </PriceExtraRow>
              ))}
            </div>
          ) : null}
        </OverviewSheet>
      </section>
    )
  }

  if (!isTokenBased) {
    return (
      <section
        className='flex flex-col gap-3'
        data-slot='model-overview-pricing'
      >
        <SectionTitle>{t('Pricing')}</SectionTitle>
        <OverviewSheet>
          <div className='flex items-baseline justify-between gap-4 px-4 py-4'>
            <span className='text-muted-foreground text-sm'>
              {t('Per request')}
            </span>
            <span className='text-foreground font-mono text-lg font-semibold tracking-tight tabular-nums'>
              {formatFixedPrice(
                props.model,
                baseGroupKey,
                props.showRechargePrice,
                props.priceRate,
                props.usdExchangeRate,
                baseGroupRatioMap
              )}
            </span>
          </div>
        </OverviewSheet>
      </section>
    )
  }

  const secondaryItems = secondaryPriceTypes.filter((item) => item.available)
  const renderPrice = (type: PriceType) => (
    <>
      {formatGroupPrice(
        props.model,
        baseGroupKey,
        type,
        props.tokenUnit,
        props.showRechargePrice,
        props.priceRate,
        props.usdExchangeRate,
        baseGroupRatioMap
      )}
      <PriceUnit unit={tokenUnitLabel} />
    </>
  )

  return (
    <section className='flex flex-col gap-3' data-slot='model-overview-pricing'>
      <SectionTitle>{t('Pricing')}</SectionTitle>
      <OverviewSheet>
        <div
          className={cn(
            'grid',
            primaryPriceTypes.length > 2
              ? 'grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0'
              : 'grid-cols-2 divide-x'
          )}
        >
          {primaryPriceTypes.map((item) => (
            <PriceCell key={item.type} label={item.label}>
              {renderPrice(item.type)}
            </PriceCell>
          ))}
        </div>
        {secondaryItems.length > 0 ? (
          <div className='divide-border divide-y border-t'>
            {secondaryItems.map((item) => (
              <PriceExtraRow key={item.type} label={item.label}>
                {renderPrice(item.type)}
              </PriceExtraRow>
            ))}
          </div>
        ) : null}
      </OverviewSheet>
    </section>
  )
}

const TAB_VALUES = ['overview', 'api'] as const
type TabValue = (typeof TAB_VALUES)[number]

const TAB_META: Record<
  TabValue,
  { icon: React.ComponentType<{ className?: string }>; labelKey: string }
> = {
  overview: { icon: Info, labelKey: 'Overview' },
  api: { icon: Code2, labelKey: 'API' },
}

export interface ModelDetailsContentProps {
  model: PricingModel
  endpointMap: Record<string, { path?: string; method?: string }>
  priceRate: number
  usdExchangeRate: number
  tokenUnit: TokenUnit
  showRechargePrice?: boolean
  stickyHeader?: boolean
  onOpenFullPage?: () => void
}

export function ModelDetailsContent(props: ModelDetailsContentProps) {
  const { t } = useTranslation()
  const showRechargePrice = props.showRechargePrice ?? false

  const isDynamic =
    props.model.billing_mode === 'tiered_expr' &&
    Boolean(props.model.billing_expr)
  const description = props.model.description || props.model.vendor_description

  return (
    <div className='@container/details flex flex-col gap-4'>
      <ModelHeader
        model={props.model}
        sticky={props.stickyHeader}
        onOpenFullPage={props.onOpenFullPage}
      />

      <Tabs defaultValue='overview' className='gap-5'>
        <TabsList
          variant='line'
          className='border-border/70 grid h-11 w-full grid-cols-2 border-b p-0 group-data-horizontal/tabs:h-11'
        >
          {TAB_VALUES.map((value) => {
            const Icon = TAB_META[value].icon
            return (
              <TabsTrigger
                key={value}
                value={value}
                className='h-10 min-w-0 gap-1.5 rounded-none px-3 text-xs sm:text-sm'
              >
                <Icon className='size-3.5' />
                <span className='truncate'>{t(TAB_META[value].labelKey)}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent
          value='overview'
          className='flex flex-col gap-6 outline-none'
        >
          {description ? (
            <p className='text-muted-foreground max-w-prose text-sm leading-relaxed'>
              {description}
            </p>
          ) : null}
          <ModelModalitiesCard model={props.model} />
          <ModelOverviewSpecs model={props.model} />
          <PriceSection
            model={props.model}
            priceRate={props.priceRate}
            usdExchangeRate={props.usdExchangeRate}
            tokenUnit={props.tokenUnit}
            showRechargePrice={showRechargePrice}
          />
          {isDynamic ? (
            <DynamicPricingBreakdown billingExpr={props.model.billing_expr} />
          ) : null}
        </TabsContent>

        <TabsContent value='api' className='outline-none'>
          <ModelDetailsApi
            model={props.model}
            endpointMap={props.endpointMap}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Drawer & page wrappers
// ----------------------------------------------------------------------------

export interface ModelDetailsDrawerProps extends ModelDetailsContentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModelDetailsDrawer(props: ModelDetailsDrawerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { open, onOpenChange, ...contentProps } = props
  const handleOpenFullPage = () => {
    void navigate({
      to: '/pricing/$modelId',
      params: { modelId: props.model.model_name },
      search: (previous) => ({ ...previous, model: undefined }),
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className={sideDrawerContentClassName(
          'sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl'
        )}
      >
        <SheetHeader className='sr-only'>
          <SheetTitle>{props.model.model_name}</SheetTitle>
          <SheetDescription>{t('Model details')}</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-y-auto px-4 pt-7 pb-5 sm:px-6 sm:pt-8 sm:pb-6'>
          <ModelDetailsContent
            {...contentProps}
            stickyHeader
            onOpenFullPage={handleOpenFullPage}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function ModelDetails() {
  const { t } = useTranslation()
  const { modelId } = useParams({ from: '/pricing/$modelId/' })
  const search = useSearch({ from: '/pricing/$modelId/' })
  const navigate = useNavigate()

  const { models, endpointMap, isLoading, priceRate, usdExchangeRate } =
    usePricingData()

  const tokenUnit: TokenUnit =
    search.tokenUnit === 'K' ? 'K' : DEFAULT_TOKEN_UNIT

  const model = useMemo(() => {
    if (!models || !modelId) return null
    return models.find((m) => m.model_name === modelId) || null
  }, [models, modelId])

  const handleBack = () => {
    navigate({ to: '/pricing', search })
  }

  if (isLoading) {
    return (
      <PublicLayout>
        <div className='mx-auto max-w-5xl px-4 sm:px-6'>
          <Skeleton className='mb-4 h-5 w-16' />
          <div className='space-y-2'>
            <Skeleton className='h-7 w-64' />
            <Skeleton className='h-4 w-40' />
            <Skeleton className='h-4 w-full max-w-md' />
          </div>
          <div className='mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4'>
            {MODEL_DETAILS_SKELETON_KEYS.map((key) => (
              <Skeleton key={`metric-${key}`} className='h-16 w-full' />
            ))}
          </div>
          <div className='mt-6 space-y-3'>
            {MODEL_DETAILS_SKELETON_KEYS.map((key) => (
              <Skeleton key={`section-${key}`} className='h-24 w-full' />
            ))}
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (!model) {
    return (
      <PublicLayout>
        <div className='mx-auto max-w-2xl px-4 text-center sm:px-6'>
          <h2 className='mb-1 text-base font-semibold'>
            {t('Model not found')}
          </h2>
          <p className='text-muted-foreground mb-4 text-sm'>
            {t("The model you're looking for doesn't exist.")}
          </p>
          <Button onClick={handleBack} variant='outline' size='sm'>
            {t('Back to Models')}
          </Button>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className='mx-auto max-w-5xl px-4 sm:px-6'>
        <Button
          variant='ghost'
          size='sm'
          onClick={handleBack}
          className='text-muted-foreground hover:text-foreground mb-4 h-auto gap-1 px-0 py-1 text-xs'
        >
          <ArrowLeft className='size-3.5' />
          {t('Back')}
        </Button>

        <ModelDetailsContent
          model={model}
          priceRate={priceRate ?? 1}
          usdExchangeRate={usdExchangeRate ?? 1}
          tokenUnit={tokenUnit}
          showRechargePrice={search.rechargePrice ?? false}
          endpointMap={
            (endpointMap as Record<
              string,
              { path?: string; method?: string }
            >) || {}
          }
        />
      </div>
    </PublicLayout>
  )
}
