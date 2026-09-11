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
import { createSectionRegistry } from '@/features/system-settings/utils/section-registry'

const ANALYTICS_SECTIONS = [
  {
    id: 'logs',
    titleKey: 'Logs',
    build: () => null,
  },
  {
    id: 'cost',
    titleKey: 'Cost',
    build: () => null,
  },
  {
    id: 'usage',
    titleKey: 'Usage',
    build: () => null,
  },
] as const

export type AnalyticsSectionId = (typeof ANALYTICS_SECTIONS)[number]['id']

const analyticsRegistry = createSectionRegistry<
  AnalyticsSectionId,
  Record<string, never>,
  []
>({
  sections: ANALYTICS_SECTIONS,
  defaultSection: 'logs',
  basePath: '/analytics',
  urlStyle: 'path',
})

export const ANALYTICS_SECTION_IDS = analyticsRegistry.sectionIds
export const ANALYTICS_DEFAULT_SECTION = analyticsRegistry.defaultSection

export function isAnalyticsSectionId(value: string): value is AnalyticsSectionId {
  return (ANALYTICS_SECTION_IDS as readonly string[]).includes(value)
}

export const ANALYTICS_SECTION_META: Record<
  AnalyticsSectionId,
  { titleKey: string }
> = {
  logs: {
    titleKey: 'Logs',
  },
  cost: {
    titleKey: 'Cost Analysis',
  },
  usage: {
    titleKey: 'Usage Analysis',
  },
}
