import { useMemo, useCallback } from 'react'

import { useDebounce } from '@/hooks/use-debounce'
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
import { useNavigate, useSearch } from '@/lib/router'

import {
  FILTER_ALL,
  SORT_OPTIONS,
  QUOTA_TYPES,
  ENDPOINT_TYPES,
  DEFAULT_TOKEN_UNIT,
  VIEW_MODES,
  MODEL_INTENTS,
  CAPABILITY_FILTERS,
  type CapabilityFilter,
  type ModelIntent,
  type ViewMode,
} from '../constants'
import { filterAndSortModels, extractAllTags } from '../lib/filters'
import type { PricingModel, TokenUnit } from '../types'

type FilterState = {
  search?: string
  intent?: ModelIntent
  sort?: string
  vendor?: string
  group?: string
  quotaType?: string
  endpointType?: string
  tag?: string
  capability?: CapabilityFilter
  tokenUnit?: TokenUnit
  view?: ViewMode
  rechargePrice?: boolean
}

function normalizeViewMode(value: unknown): ViewMode {
  if (value === VIEW_MODES.TABLE) {
    return VIEW_MODES.TABLE
  }
  return VIEW_MODES.CARD
}

function normalizeModelIntent(value: unknown): ModelIntent {
  if (
    typeof value === 'string' &&
    Object.values(MODEL_INTENTS).includes(value as ModelIntent)
  ) {
    return value as ModelIntent
  }
  return MODEL_INTENTS.ALL
}

export function useFilters(models: PricingModel[]) {
  const search = useSearch<FilterState>({ from: '/pricing/' })
  const navigate = useNavigate()

  const searchInput = typeof search.search === 'string' ? search.search : ''
  const debouncedSearchInput = useDebounce(searchInput, 200)
  const modelIntent = normalizeModelIntent(search.intent)
  const sortBy =
    typeof search.sort === 'string' ? search.sort : SORT_OPTIONS.NAME
  const vendorFilter =
    typeof search.vendor === 'string' ? search.vendor : FILTER_ALL
  const groupFilter =
    typeof search.group === 'string' ? search.group : FILTER_ALL
  const quotaTypeFilter =
    typeof search.quotaType === 'string' ? search.quotaType : QUOTA_TYPES.ALL
  const endpointTypeFilter =
    typeof search.endpointType === 'string'
      ? search.endpointType
      : ENDPOINT_TYPES.ALL
  const tagFilter = typeof search.tag === 'string' ? search.tag : FILTER_ALL
  const capabilityFilter =
    typeof search.capability === 'string'
      ? search.capability
      : CAPABILITY_FILTERS.ALL
  const tokenUnit: TokenUnit =
    search.tokenUnit === 'K' ? 'K' : DEFAULT_TOKEN_UNIT
  const viewMode = normalizeViewMode(search.view)
  const showRechargePrice = search.rechargePrice === true

  const updateFilters = useCallback(
    (updates: Record<string, unknown>) => {
      navigate({
        search: (previous) => ({ ...previous, ...updates }),
        replace: true,
      })
    },
    [navigate]
  )

  const setSearchInput = useCallback(
    (v: string) => updateFilters({ search: v || undefined }),
    [updateFilters]
  )
  const setModelIntent = useCallback(
    (value: ModelIntent) =>
      updateFilters({
        intent: value === MODEL_INTENTS.ALL ? undefined : value,
      }),
    [updateFilters]
  )
  const setSortBy = useCallback(
    (v: string) =>
      updateFilters({ sort: v === SORT_OPTIONS.NAME ? undefined : v }),
    [updateFilters]
  )
  const setVendorFilter = useCallback(
    (v: string) => updateFilters({ vendor: v === FILTER_ALL ? undefined : v }),
    [updateFilters]
  )
  const setGroupFilter = useCallback(
    (v: string) => updateFilters({ group: v === FILTER_ALL ? undefined : v }),
    [updateFilters]
  )
  const setQuotaTypeFilter = useCallback(
    (v: string) =>
      updateFilters({ quotaType: v === QUOTA_TYPES.ALL ? undefined : v }),
    [updateFilters]
  )
  const setEndpointTypeFilter = useCallback(
    (v: string) =>
      updateFilters({
        endpointType: v === ENDPOINT_TYPES.ALL ? undefined : v,
      }),
    [updateFilters]
  )
  const setTagFilter = useCallback(
    (v: string) => updateFilters({ tag: v === FILTER_ALL ? undefined : v }),
    [updateFilters]
  )
  const setCapabilityFilter = useCallback(
    (value: CapabilityFilter) =>
      updateFilters({
        capability: value === CAPABILITY_FILTERS.ALL ? undefined : value,
      }),
    [updateFilters]
  )
  const setTokenUnit = useCallback(
    (v: TokenUnit) =>
      updateFilters({ tokenUnit: v === DEFAULT_TOKEN_UNIT ? undefined : v }),
    [updateFilters]
  )
  const setViewMode = useCallback(
    (v: ViewMode) =>
      updateFilters({ view: v === VIEW_MODES.CARD ? undefined : v }),
    [updateFilters]
  )
  const setShowRechargePrice = useCallback(
    (v: boolean) => updateFilters({ rechargePrice: v || undefined }),
    [updateFilters]
  )

  const availableTags = useMemo(() => {
    if (!models || models.length === 0) return []
    return extractAllTags(models)
  }, [models])

  const filteredModels = useMemo(() => {
    if (!models || models.length === 0) return []

    return filterAndSortModels(models, {
      search: debouncedSearchInput,
      intent: modelIntent,
      vendor: vendorFilter,
      group: groupFilter,
      quotaType: quotaTypeFilter,
      endpointType: endpointTypeFilter,
      tag: tagFilter,
      capability: capabilityFilter,
      sortBy,
    })
  }, [
    models,
    debouncedSearchInput,
    modelIntent,
    vendorFilter,
    groupFilter,
    quotaTypeFilter,
    endpointTypeFilter,
    tagFilter,
    capabilityFilter,
    sortBy,
  ])

  const hasActiveFilters = useMemo(
    () =>
      vendorFilter !== FILTER_ALL ||
      groupFilter !== FILTER_ALL ||
      quotaTypeFilter !== QUOTA_TYPES.ALL ||
      endpointTypeFilter !== ENDPOINT_TYPES.ALL ||
      tagFilter !== FILTER_ALL ||
      capabilityFilter !== CAPABILITY_FILTERS.ALL ||
      modelIntent !== MODEL_INTENTS.ALL,
    [
      vendorFilter,
      groupFilter,
      quotaTypeFilter,
      endpointTypeFilter,
      tagFilter,
      capabilityFilter,
      modelIntent,
    ]
  )

  const activeFilterCount = useMemo(
    () =>
      (vendorFilter !== FILTER_ALL ? 1 : 0) +
      (groupFilter !== FILTER_ALL ? 1 : 0) +
      (quotaTypeFilter !== QUOTA_TYPES.ALL ? 1 : 0) +
      (endpointTypeFilter !== ENDPOINT_TYPES.ALL ? 1 : 0) +
      (tagFilter !== FILTER_ALL ? 1 : 0) +
      (capabilityFilter !== CAPABILITY_FILTERS.ALL ? 1 : 0),
    [
      vendorFilter,
      groupFilter,
      quotaTypeFilter,
      endpointTypeFilter,
      tagFilter,
      capabilityFilter,
    ]
  )

  const clearFilters = useCallback(() => {
    updateFilters({
      vendor: undefined,
      group: undefined,
      quotaType: undefined,
      endpointType: undefined,
      tag: undefined,
      capability: undefined,
      intent: undefined,
    })
  }, [updateFilters])

  const clearAdvancedFilters = useCallback(() => {
    updateFilters({
      vendor: undefined,
      group: undefined,
      quotaType: undefined,
      endpointType: undefined,
      tag: undefined,
      capability: undefined,
    })
  }, [updateFilters])

  const clearSearch = useCallback(() => {
    updateFilters({ search: undefined })
  }, [updateFilters])

  return {
    searchInput,
    modelIntent,
    sortBy,
    vendorFilter,
    groupFilter,
    quotaTypeFilter,
    endpointTypeFilter,
    tagFilter,
    capabilityFilter,
    tokenUnit,
    viewMode,
    showRechargePrice,
    setSearchInput,
    setModelIntent,
    setSortBy,
    setVendorFilter,
    setGroupFilter,
    setQuotaTypeFilter,
    setEndpointTypeFilter,
    setTagFilter,
    setCapabilityFilter,
    setTokenUnit,
    setViewMode,
    setShowRechargePrice,
    filteredModels,
    hasActiveFilters,
    activeFilterCount,
    availableTags,
    clearFilters,
    clearAdvancedFilters,
    clearSearch,
  }
}
