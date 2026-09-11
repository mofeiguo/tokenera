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
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnalyticsTasksPage } from '@/features/analytics/components/analytics-tasks-page'
import { CacheStatsDialog } from '@/features/system-settings/general/channel-affinity/cache-stats-dialog'
import { getRouteApi } from '@/lib/router'

import { CommonLogsStats } from './components/common-logs-stats'
import { UserInfoDialog } from './components/dialogs/user-info-dialog'
import { LogsSensitiveToggle } from './components/logs-sensitive-toggle'
import {
  type LogsViewScope,
  UsageLogsProvider,
  useLogsViewScope,
  useUsageLogsContext,
} from './components/usage-logs-provider'
import { UsageLogsTable } from './components/usage-logs-table'

const route = getRouteApi('/_authenticated/usage-logs/$section')

function UsageLogsContent() {
  const { t } = useTranslation()
  const {
    selectedUserId,
    userInfoDialogOpen,
    setUserInfoDialogOpen,
    affinityTarget,
    affinityDialogOpen,
    setAffinityDialogOpen,
  } = useUsageLogsContext()
  const { canManageScope, viewScope, setViewScope } = useLogsViewScope()

  const handleViewScopeChange = useCallback(
    (scope: string) => {
      if (scope === 'all' || scope === 'self') {
        setViewScope(scope as LogsViewScope)
      }
    },
    [setViewScope]
  )

  return (
    <>
      <SectionPageLayout fixedContent>
        <SectionPageLayout.Title>{t('Common Logs')}</SectionPageLayout.Title>
        <SectionPageLayout.Description>
          {t(
            'Review API call history, token usage, and billing details for the selected time range.'
          )}
        </SectionPageLayout.Description>
        <SectionPageLayout.Actions>
          <div className='flex flex-wrap items-center justify-end gap-2'>
            <LogsSensitiveToggle />
            {canManageScope && (
              <Tabs value={viewScope} onValueChange={handleViewScopeChange}>
                <TabsList>
                  <TabsTrigger value='all'>{t('All')}</TabsTrigger>
                  <TabsTrigger value='self'>{t('Only Mine')}</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <div className='flex h-full min-h-0 flex-col gap-4'>
            <CommonLogsStats />
            <div className='min-h-0 flex-1'>
              <UsageLogsTable logCategory='common' />
            </div>
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <UserInfoDialog
        userId={selectedUserId}
        open={userInfoDialogOpen}
        onOpenChange={setUserInfoDialogOpen}
      />

      <CacheStatsDialog
        open={affinityDialogOpen}
        onOpenChange={setAffinityDialogOpen}
        target={
          affinityTarget
            ? {
                rule_name: affinityTarget.rule_name || '',
                using_group:
                  affinityTarget.using_group ||
                  affinityTarget.selected_group ||
                  '',
                key_hint: affinityTarget.key_hint || '',
                key_fp: affinityTarget.key_fp || '',
              }
            : null
        }
      />
    </>
  )
}

export function UsageLogs() {
  const params = route.useParams()
  if (params.section === 'task') {
    return <AnalyticsTasksPage />
  }

  return (
    <UsageLogsProvider>
      <UsageLogsContent />
    </UsageLogsProvider>
  )
}
