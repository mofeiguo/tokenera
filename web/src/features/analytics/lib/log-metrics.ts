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
export function cacheReadPercent(
  promptTokens: number,
  cacheTokens: number
): number | null {
  if (promptTokens <= 0) return null
  return (Math.max(cacheTokens, 0) / promptTokens) * 100
}

export function tokensPerSecond(
  completionTokens: number,
  useTimeSeconds: number
): number | null {
  if (useTimeSeconds <= 0 || completionTokens <= 0) return null
  return completionTokens / useTimeSeconds
}

export function latencyMs(useTimeSeconds: number): number | null {
  if (useTimeSeconds <= 0) return null
  return Math.round(useTimeSeconds * 1000)
}
