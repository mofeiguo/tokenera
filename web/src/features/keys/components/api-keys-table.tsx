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
import { KeyRound, Search } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@/lib/query'
import { cn } from '@/lib/utils'

import { getApiKeys, searchApiKeys } from '../api'
import { API_KEY_STATUS_OPTIONS, ERROR_MESSAGES } from '../constants'
import type { ApiKey } from '../types'
import { ApiBaseUrlHint } from './api-base-url-hint'
import { ApiKeyRow } from './api-key-row'
import { ApiKeysListHeader } from './api-keys-list-header'
import { useApiKeys } from './api-keys-provider'
import {
  apiKeysCellClass,
  apiKeysControlClass,
  apiKeysRowClass,
  apiKeysTableClass,
} from './api-keys-styles'

const PAGE_SIZE = 20
const ALL_STATUS = 'all'

export function ApiKeysTable() {
  const { t } = useTranslation()
  const { refreshTrigger, setOpen } = useApiKeys()
  const [now, setNow] = useState(() => Date.now())
  const [page, setPage] = useState(1)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState(ALL_STATUS)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 30_000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const next = keywordInput.trim()
      setKeyword(next)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timeoutId)
  }, [keywordInput])

  const statusValue = status === ALL_STATUS ? undefined : Number(status)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['keys', page, PAGE_SIZE, keyword, statusValue, refreshTrigger],
    queryFn: async () => {
      const tokenQuery = keyword.startsWith('sk-') ? keyword.slice(3) : ''
      const result = keyword
        ? await searchApiKeys({
            keyword: tokenQuery ? '' : keyword,
            token: tokenQuery,
            status: statusValue,
            p: page,
            size: PAGE_SIZE,
          })
        : await getApiKeys({
            p: page,
            size: PAGE_SIZE,
            status: statusValue,
          })

      if (!result.success) {
        toast.error(
          result.message ||
            t(keyword ? ERROR_MESSAGES.SEARCH_FAILED : ERROR_MESSAGES.LOAD_FAILED)
        )
        return { items: [], total: 0 }
      }

      return {
        items: result.data?.items || [],
        total: result.data?.total || 0,
      }
    },
    placeholderData: (previousData) => previousData,
  })

  const items = data?.items || []

  const total = data?.total || 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const isFiltered = Boolean(keyword) || status !== ALL_STATUS

  const isEmpty = !isLoading && items.length === 0
  let bodyContent: ReactNode = items.map((apiKey: ApiKey) => (
    <ApiKeyRow apiKey={apiKey} key={apiKey.id} now={now} />
  ))
  if (isLoading) {
    bodyContent = <KeysSkeleton />
  }

  return (
    <div className='flex min-h-0 flex-col'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='relative min-w-0 sm:w-64'>
          <Search className='pointer-events-none absolute top-1/2 left-0 size-3.5 -translate-y-1/2 text-[#b0b0b0]' />
          <Input
            aria-label={t('Search API keys')}
            className={cn(apiKeysControlClass, 'pl-7')}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder={t('Search API keys')}
            value={keywordInput}
          />
        </div>
        <div className='inline-flex w-fit flex-wrap items-center rounded-[10px] bg-[#f3f3f3] p-[3px] dark:bg-muted'>
          <StatusFilterButton
            active={status === ALL_STATUS}
            label={t('All')}
            onClick={() => {
              setStatus(ALL_STATUS)
              setPage(1)
            }}
          />
          {API_KEY_STATUS_OPTIONS.map((option) => (
            <StatusFilterButton
              active={status === option.value}
              key={option.value}
              label={t(option.label)}
              onClick={() => {
                setStatus(option.value)
                setPage(1)
              }}
            />
          ))}
        </div>
      </div>

      {isEmpty ? (
        <EmptyKeys
          filtered={isFiltered}
          onClearFilters={() => {
            setKeywordInput('')
            setKeyword('')
            setStatus(ALL_STATUS)
          }}
          onCreate={() => setOpen('create')}
        />
      ) : (
        <table
          aria-busy={isFetching && !isLoading}
          className={cn(apiKeysTableClass, 'mt-2')}
        >
          <ApiKeysListHeader />
          <tbody>{bodyContent}</tbody>
        </table>
      )}

      {total > PAGE_SIZE ? (
        <div className='flex items-center justify-end gap-3 py-4'>
          <Button
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            size='sm'
            type='button'
            variant='outline'
          >
            {t('Previous')}
          </Button>
          <span className='text-muted-foreground text-sm tabular-nums'>
            {page} / {pageCount}
          </span>
          <Button
            disabled={page >= pageCount}
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            size='sm'
            type='button'
            variant='outline'
          >
            {t('Next')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function StatusFilterButton(props: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        'h-7 rounded-[7px] px-2.5 text-[12px] transition-colors',
        props.active
          ? 'bg-white font-medium text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-background dark:text-foreground'
          : 'text-[#737373] hover:text-[#171717] dark:text-muted-foreground dark:hover:text-foreground'
      )}
      onClick={props.onClick}
      type='button'
    >
      {props.label}
    </button>
  )
}

function KeysSkeleton() {
  return (
    <>
      {['a', 'b', 'c'].map((key) => (
        <tr className={apiKeysRowClass} key={key}>
          <td className={apiKeysCellClass}>
            <Skeleton className='h-4 w-28' />
          </td>
          <td className={apiKeysCellClass}>
            <Skeleton className='h-4 w-48' />
          </td>
          <td className={cn(apiKeysCellClass, 'hidden lg:table-cell')}>
            <Skeleton className='h-3 w-16' />
          </td>
          <td className={cn(apiKeysCellClass, 'hidden lg:table-cell')}>
            <Skeleton className='h-3 w-16' />
          </td>
          <td className={cn(apiKeysCellClass, 'hidden lg:table-cell')}>
            <Skeleton className='h-3 w-20' />
          </td>
          <td className={cn(apiKeysCellClass, 'hidden lg:table-cell')}>
            <Skeleton className='h-3 w-24' />
          </td>
          <td className={apiKeysCellClass} />
        </tr>
      ))}
    </>
  )
}

function EmptyKeys(props: {
  filtered: boolean
  onClearFilters: () => void
  onCreate: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className='flex flex-col items-center justify-center py-16 text-center'>
      <div className='flex size-12 items-center justify-center rounded-full bg-[#f7f7f7] dark:bg-muted'>
        <KeyRound className='size-5 text-[#999999]' />
      </div>
      <h2 className='mt-4 text-[15px] font-semibold text-[#333333] dark:text-foreground'>
        {props.filtered ? t('No matching results') : t('No API Keys Found')}
      </h2>
      <p className='mt-1 max-w-sm text-[13px] text-[#999999]'>
        {props.filtered
          ? t('Try a different search or status filter.')
          : t(
              'No API keys available. Create your first API key to get started.'
            )}
      </p>
      {props.filtered ? null : (
        <div className='mt-4'>
          <ApiBaseUrlHint />
        </div>
      )}
      <Button
        className='mt-5 h-9 rounded-[8px] px-4 text-[13px]'
        onClick={props.filtered ? props.onClearFilters : props.onCreate}
      >
        {props.filtered ? t('Clear filters') : t('Create API Key')}
      </Button>
    </div>
  )
}
