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

import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { cn } from '@/lib/utils'

import {
  getPlaygroundEndpointLabel,
  isPlaygroundEndpointType,
  PLAYGROUND_PROTOCOL_FIELD,
  PLAYGROUND_PROTOCOL_LABEL,
  PLAYGROUND_PROTOCOL_SELECT,
} from '../lib'
import type { PlaygroundEndpointType } from '../types'

type PlaygroundProtocolSelectorProps = {
  className?: string
  disabled?: boolean
  endpointTypes: PlaygroundEndpointType[]
  onChange: (value: PlaygroundEndpointType) => void
  value: PlaygroundEndpointType
}

export function PlaygroundProtocolSelector({
  className,
  disabled,
  endpointTypes,
  onChange,
  value,
}: PlaygroundProtocolSelectorProps) {
  const { t } = useTranslation()

  if (endpointTypes.length === 0) {
    return null
  }

  const selectorDisabled = disabled || endpointTypes.length === 1

  return (
    <div className={cn(PLAYGROUND_PROTOCOL_FIELD, className)}>
      <span className={PLAYGROUND_PROTOCOL_LABEL} id='playground-protocol-label'>
        {t('Protocol')}
      </span>
      <NativeSelect
        aria-labelledby='playground-protocol-label'
        className={PLAYGROUND_PROTOCOL_SELECT}
        disabled={selectorDisabled}
        onChange={(event) => {
          const nextValue = event.target.value
          if (isPlaygroundEndpointType(nextValue)) {
            onChange(nextValue)
          }
        }}
        value={value}
      >
        {endpointTypes.map((endpointType) => (
          <NativeSelectOption key={endpointType} value={endpointType}>
            {getPlaygroundEndpointLabel(t, endpointType)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
