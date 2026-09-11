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

export function formatApiKey(key: string): string {
  if (key.startsWith('sk-')) return key
  return `sk-${key}`
}

export function getApiBaseUrl(): string {
  const origin = window.location.origin
  try {
    const raw = localStorage.getItem('status')
    if (!raw) return origin
    const status = JSON.parse(raw) as { server_address?: string }
    const address = status.server_address?.trim()
    if (!address) return origin
    const stored = new URL(address, origin)
    const current = new URL(origin)
    const storedLocal =
      stored.hostname === 'localhost' || stored.hostname === '127.0.0.1'
    const currentLocal =
      current.hostname === 'localhost' || current.hostname === '127.0.0.1'
    if (storedLocal && currentLocal && stored.port !== current.port) {
      return origin
    }
    return address
  } catch {
    return origin
  }
}
