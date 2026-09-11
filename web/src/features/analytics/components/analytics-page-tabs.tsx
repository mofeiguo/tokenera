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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import type { AnalyticsPageTab } from '../types'

type AnalyticsPageTabsProps = {
  tabs: readonly AnalyticsPageTab[]
  value: string
  onValueChange: (value: string) => void
}

export function AnalyticsPageTabs(props: AnalyticsPageTabsProps) {
  return (
    <Tabs
      className='mt-6'
      onValueChange={props.onValueChange}
      value={props.value}
    >
      <TabsList
        className='h-auto w-full justify-start gap-6 rounded-none border-b border-[#e6e6e6] bg-transparent p-0 dark:border-border'
        variant='line'
      >
        {props.tabs.map((tab) => (
          <TabsTrigger
            className='text-[#666666] data-[state=active]:border-foreground data-[state=active]:text-[#333333] flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 py-3 text-sm font-medium shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:text-foreground'
            key={tab.id}
            value={tab.id}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
