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
import { useEffect } from 'react'
import { Outlet, redirect, type LoaderFunctionArgs } from 'react-router'

import { NavigationProgress } from '@/components/navigation-progress'
import { Toaster } from '@/components/ui/sonner'
import { saveAffiliateCode } from '@/features/auth/lib/storage'
import { getSetupStatus } from '@/features/setup/api'
import { useSystemConfig } from '@/hooks/use-system-config'
import {
  bootstrapAuthentication,
  clearAuthenticatedClientState,
  clearAuthentication,
} from '@/lib/auth-session'
import { subscribeAuthSessionEvents } from '@/lib/auth-session-sync'
import { resolveLegacyRoute } from '@/lib/legacy-route'
import { useQueryClient } from '@/lib/query'
import { useNavigate } from '@/lib/router'
import { useAuthStore } from '@/stores/auth-store'

const SETUP_CHECKED_KEY = 'setup_status_checked'

function getSetupStatusFromCache(): boolean {
  try {
    return window.localStorage.getItem(SETUP_CHECKED_KEY) === 'true'
  } catch {
    return false
  }
}

function setSetupStatusCache(value: boolean): void {
  try {
    if (value) window.localStorage.setItem(SETUP_CHECKED_KEY, 'true')
    else window.localStorage.removeItem(SETUP_CHECKED_KEY)
  } catch {
    /* empty */
  }
}

let setupStatusChecked = getSetupStatusFromCache()

export async function rootLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const legacyTarget = resolveLegacyRoute(
    `${url.pathname}${url.search}${url.hash}`
  )
  if (legacyTarget) throw redirect(legacyTarget)

  const pathname = url.pathname
  const needsSetupCheck = !setupStatusChecked && !pathname.startsWith('/setup')
  const authBootstrap = bootstrapAuthentication()

  if (needsSetupCheck) {
    const [status] = await Promise.all([
      getSetupStatus().catch((error) => {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn('[root.loader] setup status check failed', error)
        }
        return null
      }),
      authBootstrap,
    ])

    if (status?.success && status.data && !status.data.status) {
      throw redirect('/setup')
    }
    setupStatusChecked = true
    setSetupStatusCache(true)
  } else {
    await authBootstrap
  }

  return null
}

export function RootLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  useSystemConfig({ autoLoad: true })

  useEffect(() => {
    const aff = new URLSearchParams(window.location.search).get('aff')?.trim()
    if (aff) saveAffiliateCode(aff)
  }, [])

  useEffect(
    () =>
      useAuthStore.subscribe((state, previousState) => {
        if (state.auth.session?.sid !== previousState.auth.session?.sid) {
          queryClient.clear()
        }
      }),
    [queryClient]
  )

  useEffect(
    () =>
      subscribeAuthSessionEvents((event) => {
        const currentSID = useAuthStore.getState().auth.session?.sid

        if (event.kind === 'authenticated') {
          if (event.sid === currentSID) return
          if (currentSID) clearAuthentication(false)
          window.location.reload()
          return
        }

        if (currentSID && event.sid === currentSID) {
          clearAuthenticatedClientState(queryClient, false)
          void navigate({ to: '/sign-in', replace: true })
        }
      }),
    [navigate, queryClient]
  )

  return (
    <>
      <NavigationProgress />
      <Outlet />
      <Toaster closeButton duration={5000} position='top-center' richColors />
    </>
  )
}
