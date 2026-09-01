/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
    10|but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import {
  ComboboxInput,
  type ComboboxInputOption,
} from '@/components/ui/combobox-input'

type ComboboxProps = {
  options: ComboboxInputOption[]
  value?: string
  onValueChange?: (value: string | null) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  allowCustomValue?: boolean
  className?: string
  id?: string
  openOnFocus?: boolean
}

function Combobox(props: ComboboxProps) {
  return (
    <ComboboxInput
      id={props.id}
      options={props.options}
      value={props.value ?? ''}
      onValueChange={(value) => props.onValueChange?.(value)}
      placeholder={props.searchPlaceholder ?? props.placeholder}
      emptyText={props.emptyText}
      className={props.className}
      allowCustomValue={props.allowCustomValue}
      openOnFocus={props.openOnFocus}
    />
  )
}

export { Combobox, type ComboboxInputOption }
