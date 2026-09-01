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

import { Card, CardContent } from '@/components/ui/card'

type ModelsStatsProps = {
  modelCount: number
  vendorCount: number
  visionCount: number
  toolsCount: number
  pageScoped?: boolean
}

function StatCard(props: { value: number; label: string }) {
  return (
    <Card size='sm' className='shadow-[var(--shadow-card)]'>
      <CardContent>
        <div className='text-2xl font-bold tabular-nums'>{props.value}</div>
        <div className='text-muted-foreground text-sm'>{props.label}</div>
      </CardContent>
    </Card>
  )
}

export function ModelsStats(props: ModelsStatsProps) {
  const { t } = useTranslation()

  let visionLabel = t('Vision Models')
  let toolsLabel = t('Tool-enabled')
  if (props.pageScoped) {
    visionLabel = t('Vision Models (this page)')
    toolsLabel = t('Tool-enabled (this page)')
  }

  return (
    <div className='grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4'>
      <StatCard value={props.modelCount} label={t('Models')} />
      <StatCard value={props.vendorCount} label={t('Vendors')} />
      <StatCard value={props.visionCount} label={visionLabel} />
      <StatCard value={props.toolsCount} label={toolsLabel} />
    </div>
  )
}
