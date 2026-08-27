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
/* eslint-disable react/only-export-components */
import { AxiosError } from 'axios'
import i18next from 'i18next'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import useSWR, { SWRConfig, useSWRConfig } from 'swr'

import { handleServerError } from '@/lib/handle-server-error'

export type QueryKey = readonly unknown[]

export type InvalidateQueryFilters = {
  queryKey?: QueryKey
}

type CacheState = {
  data?: unknown
  error?: unknown
  isValidating?: boolean
}

type MutateFn = (
  key: string | ((key: string) => boolean),
  data?: unknown,
  opts?: { revalidate?: boolean }
) => Promise<unknown>

const fetchingKeys = new Map<string, number>()
const fetchingListeners = new Set<() => void>()

function notifyFetching() {
  fetchingListeners.forEach((listener) => listener())
}

function beginFetch(key: string) {
  fetchingKeys.set(key, (fetchingKeys.get(key) ?? 0) + 1)
  notifyFetching()
}

function endFetch(key: string) {
  const next = (fetchingKeys.get(key) ?? 1) - 1
  if (next <= 0) fetchingKeys.delete(key)
  else fetchingKeys.set(key, next)
  notifyFetching()
}

function countFetching(queryKey?: QueryKey): number {
  if (!queryKey) {
    let total = 0
    fetchingKeys.forEach((count) => {
      total += count
    })
    return total
  }
  let total = 0
  fetchingKeys.forEach((count, key) => {
    if (keyMatches(key, queryKey)) total += count
  })
  return total
}

export function serializeQueryKey(queryKey: QueryKey): string {
  return JSON.stringify(queryKey)
}

function keyMatches(cacheKey: string, queryKey: QueryKey): boolean {
  try {
    const parsed = JSON.parse(cacheKey) as unknown
    if (!Array.isArray(parsed) || parsed.length < queryKey.length) return false
    return queryKey.every(
      (part, index) => JSON.stringify(part) === JSON.stringify(parsed[index])
    )
  } catch {
    return false
  }
}

class MutationCache {
  private items: unknown[] = []

  build(_client: QueryClient, _options: unknown) {
    this.items.push({})
    return {}
  }

  getAll() {
    return this.items
  }

  clear() {
    this.items = []
  }
}

export class QueryClient {
  readonly cache = new Map<string, CacheState>()
  private readonly mutationCache = new MutationCache()
  private mutateFn: MutateFn | null = null
  private readonly onQueryError?: (error: unknown) => void

  constructor(options?: {
    defaultOptions?: unknown
    onQueryError?: (error: unknown) => void
  }) {
    this.onQueryError = options?.onQueryError
  }

  bindMutate(mutateFn: MutateFn) {
    this.mutateFn = mutateFn
  }

  handleQueryError(error: unknown) {
    this.onQueryError?.(error)
  }

  getQueryCache() {
    return {
      getAll: () =>
        [...this.cache.keys()].map((key) => ({
          queryKey: JSON.parse(key) as QueryKey,
        })),
    }
  }

  getMutationCache() {
    return this.mutationCache
  }

  getQueryData<T = unknown>(queryKey: QueryKey): T | undefined {
    return this.cache.get(serializeQueryKey(queryKey))?.data as T | undefined
  }

  setQueryData<T>(queryKey: QueryKey, data: T, _options?: unknown): T {
    const key = serializeQueryKey(queryKey)
    this.cache.set(key, { ...this.cache.get(key), data })
    void this.mutateFn?.(key, data, { revalidate: false })
    return data
  }

  setQueriesData<T>(
    filters: InvalidateQueryFilters,
    updater: (oldData: T | undefined) => T | undefined
  ) {
    const queryKey = filters.queryKey
    if (!queryKey) return
    this.cache.forEach((state, key) => {
      if (!keyMatches(key, queryKey)) return
      const next = updater(state.data as T | undefined)
      this.cache.set(key, { ...state, data: next })
      void this.mutateFn?.(key, next, { revalidate: false })
    })
  }

  async invalidateQueries(filters: InvalidateQueryFilters = {}) {
    const queryKey = filters.queryKey
    if (!queryKey) {
      await this.mutateFn?.(() => true, undefined, { revalidate: true })
      return
    }
    await this.mutateFn?.((key) => keyMatches(key, queryKey), undefined, {
      revalidate: true,
    })
  }

  async prefetchQuery<T>(options: {
    queryKey: QueryKey
    queryFn: () => Promise<T>
    staleTime?: number
  }) {
    const key = serializeQueryKey(options.queryKey)
    if (this.cache.get(key)?.data !== undefined) return
    beginFetch(key)
    try {
      const data = await options.queryFn()
      this.cache.set(key, { data, isValidating: false })
      await this.mutateFn?.(key, data, { revalidate: false })
    } finally {
      endFetch(key)
    }
  }

  clear() {
    this.cache.clear()
    this.mutationCache.clear()
    void this.mutateFn?.(() => true, undefined, { revalidate: false })
  }
}

const QueryClientContext = createContext<QueryClient | null>(null)

function BindSWRMutate(props: { client: QueryClient; children: ReactNode }) {
  const { mutate } = useSWRConfig()
  props.client.bindMutate(mutate as MutateFn)
  return props.children
}

export function QueryClientProvider(props: {
  client: QueryClient
  children: ReactNode
}) {
  return (
    <QueryClientContext.Provider value={props.client}>
      <SWRConfig
        value={{
          provider: () => props.client.cache,
          dedupingInterval: 10 * 1000,
          revalidateOnFocus: false,
          errorRetryCount: import.meta.env.DEV ? 0 : 3,
          shouldRetryOnError: (error) =>
            !(
              error instanceof AxiosError &&
              [401, 403].includes(error.response?.status ?? 0)
            ),
          onError: (error) => {
            props.client.handleQueryError(error)
          },
        }}
      >
        <BindSWRMutate client={props.client}>{props.children}</BindSWRMutate>
      </SWRConfig>
    </QueryClientContext.Provider>
  )
}

export function useQueryClient(): QueryClient {
  const client = useContext(QueryClientContext)
  if (!client) {
    throw new Error('useQueryClient must be used within QueryClientProvider')
  }
  return client
}

export type UseQueryResult<TData = unknown, TError = unknown> = {
  data: TData | undefined
  error: TError | undefined
  isLoading: boolean
  isPending: boolean
  isFetching: boolean
  isFetched: boolean
  isError: boolean
  refetch: () => Promise<unknown>
}

type UseQueryOptions<TQueryFnData, TData = TQueryFnData> = {
  queryKey: QueryKey
  queryFn: () => Promise<TQueryFnData> | TQueryFnData | null | undefined
  enabled?: boolean
  staleTime?: number
  gcTime?: number
  retry?: boolean | ((failureCount: number, error: unknown) => boolean)
  placeholderData?:
    | TQueryFnData
    | ((
        previousData: TQueryFnData | undefined,
        previousQuery?: { queryKey: QueryKey }
      ) => TQueryFnData | undefined)
  select?: (data: TQueryFnData) => TData
  refetchInterval?:
    | number
    | false
    | ((query: { state: { data: TQueryFnData | undefined } }) => number | false)
}

export function useQuery<TQueryFnData, TData = TQueryFnData, TError = unknown>(
  options: UseQueryOptions<TQueryFnData, TData>
): UseQueryResult<TData, TError> {
  const enabled = options.enabled ?? true
  const key = enabled ? serializeQueryKey(options.queryKey) : null
  const keepPrevious = typeof options.placeholderData === 'function'
  const fallbackData =
    typeof options.placeholderData === 'function'
      ? undefined
      : options.placeholderData

  const refreshInterval = useMemo(() => {
    const interval = options.refetchInterval
    if (interval === false || interval == null) return 0
    if (typeof interval === 'number') return interval
    return (data: TQueryFnData | undefined) => {
      const next = interval({ state: { data } })
      return next === false ? 0 : next
    }
  }, [options.refetchInterval])

  const result = useSWR(
    key,
    async () => {
      if (!key) return undefined as TQueryFnData
      beginFetch(key)
      try {
        const value = await options.queryFn()
        return (value ?? undefined) as TQueryFnData
      } finally {
        endFetch(key)
      }
    },
    {
      dedupingInterval: options.staleTime ?? 10 * 1000,
      revalidateOnFocus: false,
      shouldRetryOnError: options.retry === false ? false : undefined,
      errorRetryCount: options.retry === false ? 0 : undefined,
      fallbackData,
      keepPreviousData: keepPrevious,
      refreshInterval,
    }
  )

  const selected =
    options.select && result.data !== undefined
      ? options.select(result.data)
      : (result.data as TData | undefined)

  return {
    data: selected,
    error: result.error as TError | undefined,
    isLoading: result.isLoading,
    isPending: result.isLoading,
    isFetching: result.isValidating,
    isFetched: !result.isLoading,
    isError: Boolean(result.error),
    refetch: () => result.mutate(),
  }
}

export function useIsFetching(filters?: { queryKey?: QueryKey }) {
  const queryKey = filters?.queryKey
  return useSyncExternalStore(
    (onStoreChange) => {
      fetchingListeners.add(onStoreChange)
      return () => {
        fetchingListeners.delete(onStoreChange)
      }
    },
    () => countFetching(queryKey),
    () => 0
  )
}

type UseMutationOptions<TData, TVariables> = {
  mutationFn: (variables: TVariables) => Promise<TData>
  mutationKey?: QueryKey
  onMutate?: (variables: TVariables) => void | Promise<void>
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>
  onError?: (error: Error, variables: TVariables) => void
  onSettled?: () => void
}

export function useMutation<TData = unknown, TVariables = void>(
  options: UseMutationOptions<TData, TVariables>
) {
  const [state, setState] = useState<{
    data?: TData
    error?: Error
    isPending: boolean
  }>({ isPending: false })
  const optionsRef = useRef(options)
  optionsRef.current = options

  const mutateAsync = useCallback(async (variables: TVariables) => {
    setState({ isPending: true })
    try {
      await optionsRef.current.onMutate?.(variables)
      const data = await optionsRef.current.mutationFn(variables)
      await optionsRef.current.onSuccess?.(data, variables)
      setState({ isPending: false, data })
      return data
    } catch (error) {
      handleServerError(error)
      if (error instanceof AxiosError && error.response?.status === 304) {
        toast.error(i18next.t('Content not modified!'))
      }
      const normalized =
        error instanceof Error ? error : new Error(String(error))
      optionsRef.current.onError?.(normalized, variables)
      setState({ isPending: false, error: normalized })
      throw normalized
    } finally {
      optionsRef.current.onSettled?.()
    }
  }, [])

  const mutate = useCallback(
    (
      variables: TVariables,
      callbacks?: {
        onSuccess?: (data: TData) => void
        onError?: (error: Error) => void
      }
    ) => {
      void mutateAsync(variables)
        .then((data) => callbacks?.onSuccess?.(data))
        .catch((error: Error) => callbacks?.onError?.(error))
    },
    [mutateAsync]
  )

  return {
    mutate,
    mutateAsync,
    data: state.data,
    error: state.error,
    isPending: state.isPending,
    isError: Boolean(state.error),
    reset: () => setState({ isPending: false }),
  }
}
