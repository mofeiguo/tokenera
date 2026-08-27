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
import { Skeleton } from '@/components/ui/skeleton'

import { VIEW_MODES, type ViewMode } from '../constants'

const CARD_SKELETON_KEYS = [
  'card-a',
  'card-b',
  'card-c',
  'card-d',
  'card-e',
  'card-f',
  'card-g',
  'card-h',
  'card-i',
  'card-j',
  'card-k',
  'card-l',
]
const TABLE_COLUMNS = [
  { key: 'model', width: 200 },
  { key: 'provider', width: 100 },
  { key: 'input', width: 100 },
  { key: 'output', width: 100 },
  { key: 'type', width: 80 },
  { key: 'endpoint', width: 100 },
]
const TABLE_ROW_KEYS = [
  'row-a',
  'row-b',
  'row-c',
  'row-d',
  'row-e',
  'row-f',
  'row-g',
  'row-h',
  'row-i',
  'row-j',
]
const PAGINATION_KEYS = ['previous', 'one', 'two', 'next']

export interface LoadingSkeletonProps {
  viewMode?: ViewMode
}

export function LoadingSkeleton(props: LoadingSkeletonProps) {
  const viewMode = props.viewMode ?? VIEW_MODES.CARD

  return (
    <div className='space-y-5'>
      <div className='space-y-2'>
        <Skeleton className='h-9 w-52 sm:h-10' />
        <Skeleton className='h-4 w-40' />
      </div>
      <Skeleton className='h-11 w-full rounded-lg sm:h-12' />
      <div className='border-border/60 flex items-center justify-between gap-4 border-y py-3'>
        <div className='flex gap-2'>
          {['all', 'chat', 'image', 'video', 'embeddings'].map((key) => (
            <Skeleton key={key} className='h-8 w-16 rounded-md' />
          ))}
        </div>
        <Skeleton className='h-8 w-16 rounded-md' />
      </div>
      {viewMode === VIEW_MODES.TABLE ? (
        <TableContentSkeleton />
      ) : (
        <CardContentSkeleton />
      )}
    </div>
  )
}

function CardContentSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
      {CARD_SKELETON_KEYS.map((key) => (
        <div
          key={key}
          className='bg-card border-border/80 min-h-52 rounded-xl border p-5 shadow-xs'
        >
          <div className='flex items-start justify-between gap-3'>
            <div className='flex min-w-0 items-start gap-3'>
              <Skeleton className='size-10 shrink-0 rounded-lg' />
              <div className='min-w-0 flex-1 space-y-2'>
                <Skeleton className='h-5 w-36' />
                <Skeleton className='h-3.5 w-28' />
              </div>
            </div>
            <Skeleton className='size-8 rounded-md' />
          </div>
          <div className='mt-3 flex items-center gap-1.5'>
            <Skeleton className='size-6 rounded-md' />
            <Skeleton className='size-6 rounded-md' />
            <Skeleton className='size-6 rounded-md' />
          </div>
          <div className='border-border/60 mt-8 grid grid-cols-2 gap-4 border-t pt-4'>
            <div className='space-y-2'>
              <Skeleton className='h-3 w-14' />
              <Skeleton className='h-4 w-20' />
            </div>
            <div className='space-y-2'>
              <Skeleton className='h-3 w-14' />
              <Skeleton className='h-4 w-20' />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TableContentSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='bg-card border-border/80 overflow-hidden rounded-xl border shadow-xs'>
        <div className='bg-muted/30 border-border/60 border-b px-4 py-3'>
          <div className='flex items-center gap-4'>
            {TABLE_COLUMNS.map((column) => (
              <Skeleton
                key={column.key}
                className='h-4'
                style={{ width: `${column.width}px` }}
              />
            ))}
          </div>
        </div>
        {TABLE_ROW_KEYS.map((rowKey) => (
          <div
            key={rowKey}
            className='border-border/50 flex items-center gap-4 border-b px-4 py-3 last:border-b-0'
          >
            {TABLE_COLUMNS.map((column) => (
              <Skeleton
                key={`${rowKey}-${column.key}`}
                className='h-5'
                style={{ width: `${column.width}px` }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-5 w-32' />
        <div className='flex items-center gap-2'>
          {PAGINATION_KEYS.map((key) => (
            <Skeleton key={key} className='size-8 rounded-md' />
          ))}
        </div>
      </div>
    </div>
  )
}
