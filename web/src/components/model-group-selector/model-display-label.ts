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
export type ModelSelectorOption = {
  icon?: string
  label: string
  outputModalities?: string[]
  value: string
  vendorName?: string
}

function modelBaseName(model: ModelSelectorOption): string {
  return model.label || model.value
}

/** ZenMux trigger: `Vendor: Model` */
export function formatModelSelectorTriggerLabel(
  model: ModelSelectorOption | undefined,
  fallback: string
): string {
  return formatModelSelectorListLabel(model, fallback)
}

/** ZenMux list row: `Vendor: Model` */
export function formatModelSelectorListLabel(
  model: ModelSelectorOption | undefined,
  fallback: string
): string {
  if (!model) {
    return fallback
  }

  const name = modelBaseName(model)
  if (model.vendorName) {
    return `${model.vendorName}: ${name}`
  }

  return name
}

/** @deprecated Use formatModelSelectorTriggerLabel */
export function formatModelSelectorLabel(
  model: ModelSelectorOption | undefined,
  fallback: string
): string {
  return formatModelSelectorTriggerLabel(model, fallback)
}
