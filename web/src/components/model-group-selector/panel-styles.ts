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
export const zenmuxModelPanelClasses = {
  panel:
    'bg-popover flex max-h-[min(28rem,70vh)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border p-0 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]',
  toolbar: 'flex items-center gap-2 border-b px-3 py-3',
  searchWrap: 'relative min-w-0 flex-1',
  searchIcon:
    'text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2',
  searchInput:
    'bg-muted/50 h-9 w-full rounded-full border-0 pr-3 pl-9 text-sm shadow-none ring-0 placeholder:text-muted-foreground/80 focus-visible:ring-0',
  sortButton:
    'text-foreground h-9 shrink-0 gap-1.5 rounded-full border px-3 text-sm font-normal shadow-none',
  tabsWrap: 'bg-muted/60 mx-3 mt-3 flex rounded-xl p-1',
  tabButton:
    'h-8 flex-1 rounded-lg px-2 text-sm font-medium transition-colors',
  tabActive: 'bg-background text-foreground shadow-sm',
  tabInactive: 'text-muted-foreground hover:text-foreground',
  list: 'mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-2 [scrollbar-width:thin]',
  listItem:
    'hover:bg-muted/70 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors',
  listItemActive: 'bg-muted/80',
  listItemLabel: 'text-foreground min-w-0 truncate font-normal leading-5',
  empty: 'text-muted-foreground px-3 py-10 text-center text-sm',
} as const
