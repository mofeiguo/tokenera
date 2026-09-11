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
import { useTranslation } from 'react-i18next'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCompactNumber, formatLogQuota, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

import type { ModelBreakdownRow } from '../lib/aggregates'
import { AnalyticsNameCell } from './analytics-name-cell'
import {
  analyticsCardClass,
  analyticsTableCellClass,
  analyticsTableHeadClass,
} from './analytics-styles'

type AnalyticsModelTableProps = {
  metric: 'tokens' | 'quota'
  rows: ModelBreakdownRow[]
}

export function AnalyticsModelTable(props: AnalyticsModelTableProps) {
  const { t } = useTranslation()
  const isCost = props.metric === 'quota'

  return (
    <section className={cn(analyticsCardClass, 'overflow-hidden')}>
      <div className='px-6 py-4'>
        <h2 className='text-[14px] font-semibold text-[#333333] dark:text-foreground'>
          {isCost ? t('Cost by Model') : t('Usage by Model')}
        </h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            <TableHead className={analyticsTableHeadClass}>{t('Model')}</TableHead>
            <TableHead className={cn(analyticsTableHeadClass, 'text-right')}>
              {t('Requests')}
            </TableHead>
            <TableHead className={cn(analyticsTableHeadClass, 'text-right')}>
              {t('Tokens')}
            </TableHead>
            <TableHead className={cn(analyticsTableHeadClass, 'text-right')}>
              {t('Cost')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.rows.length === 0 ? (
            <TableRow>
              <TableCell
                className='text-muted-foreground h-24 text-center text-sm'
                colSpan={4}
              >
                {t('No data')}
              </TableCell>
            </TableRow>
          ) : (
            props.rows.map((row) => (
              <TableRow
                className='hover:bg-[#fafafa] dark:hover:bg-muted/30'
                key={row.model}
              >
                <TableCell className={analyticsTableCellClass}>
                  <AnalyticsNameCell name={row.model} />
                </TableCell>
                <TableCell
                  className={cn(analyticsTableCellClass, 'text-right tabular-nums')}
                >
                  {formatNumber(row.count)}
                </TableCell>
                <TableCell
                  className={cn(analyticsTableCellClass, 'text-right tabular-nums')}
                >
                  {formatCompactNumber(row.tokens)}
                </TableCell>
                <TableCell
                  className={cn(analyticsTableCellClass, 'text-right tabular-nums')}
                >
                  {formatLogQuota(row.quota)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  )
}
