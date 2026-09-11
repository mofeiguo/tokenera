/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import {
  createBrowserRouter,
  redirect,
  type LoaderFunctionArgs,
} from 'react-router'

import { About } from '@/features/about'
import { Analytics } from '@/features/analytics'
import { ANALYTICS_HOME_URL } from '@/features/analytics/nav'
import {
  ANALYTICS_DEFAULT_SECTION,
  ANALYTICS_SECTION_IDS,
} from '@/features/analytics/section-registry'
import { ForgotPassword } from '@/features/auth/forgot-password'
import { Otp } from '@/features/auth/otp'
import { SignIn } from '@/features/auth/sign-in'
import { SignUp } from '@/features/auth/sign-up'
import { Channels } from '@/features/channels'
import { Dashboard } from '@/features/dashboard'
import { DASHBOARD_SECTION_IDS } from '@/features/dashboard/section-registry'
import { ForbiddenError } from '@/features/errors/forbidden'
import { GeneralError } from '@/features/errors/general-error'
import { MaintenanceError } from '@/features/errors/maintenance-error'
import { NotFoundError } from '@/features/errors/not-found-error'
import { UnauthorisedError } from '@/features/errors/unauthorized-error'
import { Home } from '@/features/home'
import { ApiKeys } from '@/features/keys'
import { PrivacyPolicy, UserAgreement } from '@/features/legal'
import { Models } from '@/features/models'
import {
  MODELS_DEFAULT_SECTION,
  MODELS_SECTION_IDS,
} from '@/features/models/section-registry'
import { Pricing } from '@/features/pricing'
import { ModelDetails } from '@/features/pricing/components/model-details'
import { Profile } from '@/features/profile'
import { Rankings } from '@/features/rankings'
import { Redemptions } from '@/features/redemption-codes'
import { SetupWizard } from '@/features/setup'
import { getSetupStatus } from '@/features/setup/api'
import { Subscriptions } from '@/features/subscriptions'
import { SystemInfo } from '@/features/system-info'
import { AuthSettings } from '@/features/system-settings/auth'
import {
  AUTH_DEFAULT_SECTION,
  AUTH_SECTION_IDS,
} from '@/features/system-settings/auth/section-registry'
import { BillingSettings } from '@/features/system-settings/billing'
import {
  BILLING_DEFAULT_SECTION,
  BILLING_SECTION_IDS,
} from '@/features/system-settings/billing/section-registry'
import { ContentSettings } from '@/features/system-settings/content'
import {
  CONTENT_DEFAULT_SECTION,
  CONTENT_SECTION_IDS,
} from '@/features/system-settings/content/section-registry'
import { ModelSettings } from '@/features/system-settings/models'
import {
  MODELS_DEFAULT_SECTION as SETTINGS_MODELS_DEFAULT_SECTION,
  MODELS_SECTION_IDS as SETTINGS_MODELS_SECTION_IDS,
} from '@/features/system-settings/models/section-registry'
import { OperationsSettings } from '@/features/system-settings/operations'
import {
  OPERATIONS_DEFAULT_SECTION,
  OPERATIONS_SECTION_IDS,
} from '@/features/system-settings/operations/section-registry'
import { SecuritySettings } from '@/features/system-settings/security'
import {
  SECURITY_DEFAULT_SECTION,
  SECURITY_SECTION_IDS,
} from '@/features/system-settings/security/section-registry'
import { SiteSettings } from '@/features/system-settings/site'
import {
  SITE_DEFAULT_SECTION,
  SITE_SECTION_IDS,
} from '@/features/system-settings/site/section-registry'
import { UsageLogs } from '@/features/usage-logs'
import {
  isUsageLogsSectionId,
  USAGE_LOGS_DEFAULT_SECTION,
} from '@/features/usage-logs/section-registry'
import { Users } from '@/features/users'
import { ROLE } from '@/lib/roles'
import {
  moduleAccessLoader,
  playgroundLoader,
  RequireAuth,
  RequireGuest,
  requireRole,
  requireSection,
  requireSuperAdmin,
  SuperAdminLayout,
} from '@/routes/guards'
import { OAuthProviderPage } from '@/routes/pages/oauth-provider-page'
import { PlaygroundPage } from '@/routes/pages/playground-page'
import { ResetPasswordPage } from '@/routes/pages/reset-password-page'
import { RouteErrorPage } from '@/routes/pages/route-error-page'
import { WalletPage } from '@/routes/pages/wallet-page'
import { WechatOAuthPage } from '@/routes/pages/wechat-oauth-page'
import { RootLayout, rootLoader } from '@/routes/root-layout'

function settingsIndex(path: string) {
  return () => {
    throw redirect(path)
  }
}

async function setupLoader() {
  const status = await getSetupStatus().catch((error) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[setup.loader] failed to fetch setup status', error)
    }
    return null
  })
  if (status?.success && status.data?.status) throw redirect('/')
  return null
}

function usageLogsLoader({ params, request }: LoaderFunctionArgs) {
  if (!params.section || !isUsageLogsSectionId(params.section)) {
    throw redirect(`/usage-logs/${USAGE_LOGS_DEFAULT_SECTION}`)
  }
  const url = new URL(request.url)
  if (params.section !== 'common' && url.searchParams.has('type')) {
    url.searchParams.delete('type')
    throw redirect(`${url.pathname}${url.search}`)
  }
  return null
}

const adminLoader = requireRole(ROLE.ADMIN)
const superAdminLoader = requireSuperAdmin()

export const appRouter = createBrowserRouter([
  {
    id: 'root',
    loader: rootLoader,
    Component: RootLayout,
    errorElement: <GeneralError />,
    children: [
      { index: true, Component: Home },
      { path: 'about', Component: About },
      {
        path: 'pricing',
        loader: ({ request }) => moduleAccessLoader('pricing', request),
        Component: Pricing,
      },
      {
        path: 'pricing/:modelId',
        loader: ({ request }) => moduleAccessLoader('pricing', request),
        Component: ModelDetails,
      },
      {
        path: 'rankings',
        loader: ({ request }) => moduleAccessLoader('rankings', request),
        Component: Rankings,
      },
      { path: 'privacy-policy', Component: PrivacyPolicy },
      { path: 'user-agreement', Component: UserAgreement },
      { path: 'setup', loader: setupLoader, Component: SetupWizard },
      { path: 'oauth/:provider', Component: OAuthProviderPage },
      { path: '401', Component: UnauthorisedError },
      { path: '403', Component: ForbiddenError },
      { path: '404', Component: NotFoundError },
      { path: '500', Component: GeneralError },
      { path: '503', Component: MaintenanceError },
      {
        path: 'sign-in',
        element: (
          <RequireGuest>
            <SignIn />
          </RequireGuest>
        ),
      },
      {
        path: 'sign-up',
        element: (
          <RequireGuest>
            <SignUp />
          </RequireGuest>
        ),
      },
      {
        path: 'register',
        loader: () => {
          throw redirect('/sign-up')
        },
      },
      { path: 'otp', Component: Otp },
      { path: 'forgot-password', Component: ForgotPassword },
      { path: 'reset', Component: ResetPasswordPage },
      { path: 'user/reset', Component: ResetPasswordPage },
      { path: 'oauth', Component: WechatOAuthPage },
      {
        Component: RequireAuth,
        children: [
          {
            path: 'analytics',
            loader: settingsIndex(`/analytics/${ANALYTICS_DEFAULT_SECTION}`),
          },
          {
            path: 'analytics/:section',
            loader: requireSection(
              ANALYTICS_SECTION_IDS,
              `/analytics/${ANALYTICS_DEFAULT_SECTION}`
            ),
            Component: Analytics,
          },
          {
            path: 'dashboard',
            loader: settingsIndex(ANALYTICS_HOME_URL),
          },
          {
            path: 'dashboard/:section',
            loader: (args) => {
              if (
                args.params.section === 'models' ||
                args.params.section === 'overview'
              ) {
                throw redirect(ANALYTICS_HOME_URL)
              }
              return requireSection(
                DASHBOARD_SECTION_IDS,
                ANALYTICS_HOME_URL
              )(args)
            },
            Component: Dashboard,
          },
          { path: 'channels', loader: adminLoader, Component: Channels },
          { path: 'keys', Component: ApiKeys },
          { path: 'users', loader: adminLoader, Component: Users },
          {
            path: 'models',
            loader: async (args) => {
              await adminLoader(args)
              throw redirect(`/models/${MODELS_DEFAULT_SECTION}`)
            },
          },
          {
            path: 'models/:section',
            loader: async (args) => {
              await adminLoader(args)
              return requireSection(
                MODELS_SECTION_IDS,
                `/models/${MODELS_DEFAULT_SECTION}`
              )(args)
            },
            Component: Models,
          },
          {
            path: 'usage-logs',
            loader: settingsIndex(`/usage-logs/${USAGE_LOGS_DEFAULT_SECTION}`),
          },
          {
            path: 'usage-logs/:section',
            loader: usageLogsLoader,
            Component: UsageLogs,
          },
          { path: 'wallet', Component: WalletPage },
          { path: 'profile', Component: Profile },
          {
            path: 'playground',
            loader: playgroundLoader,
            Component: PlaygroundPage,
          },
          {
            path: 'studio/chat',
            loader: playgroundLoader,
            Component: PlaygroundPage,
          },
          {
            path: 'studio/image',
            loader: playgroundLoader,
            Component: PlaygroundPage,
          },
          {
            path: 'studio/video',
            loader: playgroundLoader,
            Component: PlaygroundPage,
          },
          {
            path: 'subscriptions',
            loader: adminLoader,
            Component: Subscriptions,
          },
          {
            path: 'redemption-codes',
            loader: adminLoader,
            Component: Redemptions,
          },
          {
            path: 'system-info',
            loader: superAdminLoader,
            Component: SystemInfo,
          },
          { path: 'errors/:error', Component: RouteErrorPage },
          {
            path: 'system-settings',
            loader: superAdminLoader,
            Component: SuperAdminLayout,
            children: [
              {
                index: true,
                loader: settingsIndex(
                  `/system-settings/site/${SITE_DEFAULT_SECTION}`
                ),
              },
              {
                path: 'site',
                loader: settingsIndex(
                  `/system-settings/site/${SITE_DEFAULT_SECTION}`
                ),
              },
              {
                path: 'site/:section',
                loader: requireSection(
                  SITE_SECTION_IDS,
                  `/system-settings/site/${SITE_DEFAULT_SECTION}`
                ),
                Component: SiteSettings,
              },
              {
                path: 'auth',
                loader: settingsIndex(
                  `/system-settings/auth/${AUTH_DEFAULT_SECTION}`
                ),
              },
              {
                path: 'auth/:section',
                loader: requireSection(
                  AUTH_SECTION_IDS,
                  `/system-settings/auth/${AUTH_DEFAULT_SECTION}`
                ),
                Component: AuthSettings,
              },
              {
                path: 'security',
                loader: settingsIndex(
                  `/system-settings/security/${SECURITY_DEFAULT_SECTION}`
                ),
              },
              {
                path: 'security/:section',
                loader: requireSection(
                  SECURITY_SECTION_IDS,
                  `/system-settings/security/${SECURITY_DEFAULT_SECTION}`
                ),
                Component: SecuritySettings,
              },
              {
                path: 'operations',
                loader: settingsIndex(
                  `/system-settings/operations/${OPERATIONS_DEFAULT_SECTION}`
                ),
              },
              {
                path: 'operations/:section',
                loader: requireSection(
                  OPERATIONS_SECTION_IDS,
                  `/system-settings/operations/${OPERATIONS_DEFAULT_SECTION}`
                ),
                Component: OperationsSettings,
              },
              {
                path: 'models',
                loader: settingsIndex(
                  `/system-settings/models/${SETTINGS_MODELS_DEFAULT_SECTION}`
                ),
              },
              {
                path: 'models/:section',
                loader: requireSection(
                  SETTINGS_MODELS_SECTION_IDS,
                  `/system-settings/models/${SETTINGS_MODELS_DEFAULT_SECTION}`
                ),
                Component: ModelSettings,
              },
              {
                path: 'content',
                loader: settingsIndex(
                  `/system-settings/content/${CONTENT_DEFAULT_SECTION}`
                ),
              },
              {
                path: 'content/:section',
                loader: requireSection(
                  CONTENT_SECTION_IDS,
                  `/system-settings/content/${CONTENT_DEFAULT_SECTION}`
                ),
                Component: ContentSettings,
              },
              {
                path: 'billing',
                loader: settingsIndex(
                  `/system-settings/billing/${BILLING_DEFAULT_SECTION}`
                ),
              },
              {
                path: 'billing/:section',
                loader: requireSection(
                  BILLING_SECTION_IDS,
                  `/system-settings/billing/${BILLING_DEFAULT_SECTION}`
                ),
                Component: BillingSettings,
              },
            ],
          },
        ],
      },
      { path: '*', Component: NotFoundError },
    ],
  },
])
