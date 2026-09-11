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

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

import type { DashboardSectionId } from '../section-registry'

type DashboardSectionTabsProps = {
  activeSection: DashboardSectionId
  sections: DashboardSectionId[]
  getSectionTitleKey: (section: DashboardSectionId) => string
  onSectionChange: (section: string) => void
  className?: string
}

export function DashboardSectionTabs(props: DashboardSectionTabsProps) {
  const { t } = useTranslation()

  return (
    <Tabs
      value={props.activeSection}
      onValueChange={props.onSectionChange}
      className={cn('min-w-0 flex-1', props.className)}
    >
      <TabsList
        variant='line'
        className='border-border/60 h-auto w-full justify-start gap-0 rounded-none border-b bg-transparent p-0'
      >
        {props.sections.map((section) => (
          <TabsTrigger
            key={section}
            value={section}
            className='text-muted-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 py-2.5 text-sm font-normal shadow-none sm:px-4 data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:shadow-none'
          >
            {t(props.getSectionTitleKey(section))}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
