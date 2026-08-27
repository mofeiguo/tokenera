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
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'
import { useNavigate, useSearch } from '@/lib/router'

import {
  LoadingSkeleton,
  EmptyState,
  PricingTable,
  ModelCardGrid,
  ModelDetailsDrawer,
} from './components'
import { CatalogToolbar } from './components/catalog-toolbar'
import { VIEW_MODES } from './constants'
import { useFilters } from './hooks/use-filters'
import { usePricingData } from './hooks/use-pricing-data'

export function Pricing() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = useSearch<{ model?: string }>({ from: '/pricing/' })
  const selectedModelName =
    typeof search.model === 'string' ? search.model : null

  const {
    models,
    endpointMap,
    isLoading,
    priceRate,
    usdExchangeRate,
  } = usePricingData()

  const {
    searchInput,
    modelIntent,
    capabilityFilter,
    groupFilter,
    tokenUnit,
    viewMode,
    showRechargePrice,
    setSearchInput,
    setModelIntent,
    setCapabilityFilter,
    setViewMode,
    filteredModels,
    hasActiveFilters,
    clearFilters,
    clearSearch,
  } = useFilters(models || [])

  const handleModelClick = useCallback(
    (modelName: string) => {
      navigate({
        search: (previous) => ({ ...previous, model: modelName }),
      })
    },
    [navigate]
  )

  const handleDetailsOpenChange = useCallback(
    (open: boolean) => {
      if (open) return
      navigate({
        search: (previous) => ({ ...previous, model: undefined }),
        replace: true,
      })
    },
    [navigate]
  )

  const selectedModel = useMemo(
    () =>
      selectedModelName
        ? (models || []).find(
            (model) => model.model_name === selectedModelName
          ) || null
        : null,
    [models, selectedModelName]
  )

  const handleClearAll = useCallback(() => {
    clearFilters()
    clearSearch()
  }, [clearFilters, clearSearch])

  const renderPricingContent = () => {
    if (filteredModels.length === 0) {
      return (
        <EmptyState
          searchQuery={searchInput}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearAll}
        />
      )
    }

    if (viewMode === VIEW_MODES.CARD) {
      return (
        <ModelCardGrid
          models={filteredModels}
          onModelClick={handleModelClick}
          priceRate={priceRate}
          usdExchangeRate={usdExchangeRate}
          tokenUnit={tokenUnit}
          showRechargePrice={showRechargePrice}
          selectedGroup={groupFilter}
        />
      )
    }

    return (
      <PricingTable
        models={filteredModels}
        priceRate={priceRate}
        usdExchangeRate={usdExchangeRate}
        tokenUnit={tokenUnit}
        showRechargePrice={showRechargePrice}
        selectedGroup={groupFilter}
        onModelClick={handleModelClick}
      />
    )
  }

  if (isLoading) {
    return (
      <PublicLayout showMainContainer={false}>
        <div className='mx-auto w-full max-w-[1800px] px-4 pt-20 pb-10 sm:px-6 sm:pt-24 xl:px-8'>
          <LoadingSkeleton viewMode={viewMode} />
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout showMainContainer={false}>
      <PageTransition className='mx-auto w-full max-w-[1800px] px-4 pt-20 pb-10 sm:px-6 sm:pt-24 xl:px-8'>
        <header className='mb-5 space-y-1.5 sm:mb-6'>
          <h1 className='min-w-0 text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.15] font-semibold tracking-tight [overflow-wrap:anywhere]'>
            {t('Model Square')}
          </h1>
          <p className='text-muted-foreground/80 max-w-2xl text-sm'>
            {t('{{count}} models ready to explore', {
              count: models?.length || 0,
            })}
          </p>
        </header>

        <CatalogToolbar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onClearSearch={clearSearch}
          modelIntent={modelIntent}
          onModelIntentChange={setModelIntent}
          capabilityFilter={capabilityFilter}
          onCapabilityFilterChange={setCapabilityFilter}
          filteredCount={filteredModels.length}
          totalCount={models?.length || 0}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <div className='mt-5 min-w-0 sm:mt-6'>{renderPricingContent()}</div>

        {selectedModel && (
          <ModelDetailsDrawer
            open={Boolean(selectedModel)}
            onOpenChange={handleDetailsOpenChange}
            model={selectedModel}
            endpointMap={
              (endpointMap as Record<
                string,
                { path?: string; method?: string }
              >) || {}
            }
            priceRate={priceRate ?? 1}
            usdExchangeRate={usdExchangeRate ?? 1}
            tokenUnit={tokenUnit}
            showRechargePrice={showRechargePrice}
          />
        )}
      </PageTransition>
    </PublicLayout>
  )
}
