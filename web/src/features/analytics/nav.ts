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
// User-facing analysis. The same three pages are shown to every role;
// admin-only analysis will be added as separate routes later.
export const ANALYTICS_NAV_ITEMS = [
  { titleKey: 'Logs', url: '/analytics/logs' },
  { titleKey: 'Cost', url: '/analytics/cost' },
  { titleKey: 'Usage', url: '/analytics/usage' },
] as const

export const ANALYTICS_NAV_URLS = ANALYTICS_NAV_ITEMS.map((item) => item.url)

/** Default signed-in landing page after Overview was removed. */
export const ANALYTICS_HOME_URL = '/analytics/usage'
