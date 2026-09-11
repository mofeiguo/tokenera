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
import { resolveModelProvider } from '@/features/usage-logs/lib/resolve-model-provider'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

type AnalyticsNameCellProps = {
  className?: string
  name?: string | null
}

export function AnalyticsNameCell(props: AnalyticsNameCellProps) {
  const name = props.name?.trim()
  if (!name) {
    return <span className='text-[#999999]'>—</span>
  }

  const provider = resolveModelProvider(name)

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', props.className)}>
      <span className='inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full'>
        {provider
          ? getLobeIcon(provider.icon, 18)
          : getLobeIcon(undefined, 18)}
      </span>
      <span className='truncate'>{name}</span>
    </span>
  )
}
