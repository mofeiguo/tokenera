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

import { AnalyticsPageShell } from '@/features/analytics/components/analytics-page-shell'
import { useStatus } from '@/hooks/use-status'

import { CheckinCalendarCard } from './components/checkin-calendar-card'
import { ProfileHeader } from './components/profile-header'
import { ProfileSecurityCard } from './components/profile-security-card'
import { ProfileSettingsCard } from './components/profile-settings-card'
import { useProfile } from './hooks'

export function Profile() {
  const { t } = useTranslation()
  const { profile, loading, refreshProfile } = useProfile()
  const { status } = useStatus()

  const checkinEnabled = status?.checkin_enabled === true
  const turnstileEnabled = !!(
    status?.turnstile_check && status?.turnstile_site_key
  )
  const turnstileSiteKey = status?.turnstile_site_key || ''

  return (
    <AnalyticsPageShell
      onRefresh={() => {
        void refreshProfile()
      }}
      refreshing={loading}
      title={t('Settings')}
      toolbar={<ProfileHeader loading={loading} profile={profile} />}
    >
      <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.42fr)] xl:items-start'>
        <ProfileSettingsCard
          loading={loading}
          onProfileUpdate={refreshProfile}
          profile={profile}
        />

        <div className='space-y-4 xl:sticky xl:top-6'>
          <ProfileSecurityCard loading={loading} profile={profile} />
          {checkinEnabled ? (
            <CheckinCalendarCard
              checkinEnabled={checkinEnabled}
              turnstileEnabled={turnstileEnabled}
              turnstileSiteKey={turnstileSiteKey}
            />
          ) : null}
        </div>
      </div>
    </AnalyticsPageShell>
  )
}
