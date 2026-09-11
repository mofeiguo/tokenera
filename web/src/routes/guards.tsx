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
import type { ReactNode } from 'react'
import {
  Navigate,
  Outlet,
  redirect,
  type LoaderFunctionArgs,
} from 'react-router'

import { AuthenticatedLayout } from '@/components/layout'
import {
  buildSignInRedirectParam,
  sanitizeAuthRedirect,
  signInPathWithRedirect,
} from '@/features/auth/lib/auth-redirect'
import { bootstrapAuthentication } from '@/lib/auth-session'
import { getFreshModuleAccess, isSidebarModuleEnabled } from '@/lib/nav-modules'
import { ROLE } from '@/lib/roles'
import { serializeSearch } from '@/lib/router'
import { useAuthStore } from '@/stores/auth-store'

function signInRedirect(requestUrl: string) {
  let origin: string
  try {
    origin = new URL(requestUrl).origin
  } catch {
    return redirect('/sign-in')
  }
  const redirectParam = buildSignInRedirectParam(requestUrl, origin)
  if (!redirectParam) return redirect('/sign-in')
  return redirect(`/sign-in${serializeSearch({ redirect: redirectParam })}`)
}

/**
 * Loaders for matched routes run in parallel with the root bootstrap loader.
 * Await session refresh here so role checks do not race an empty auth store
 * (hard refresh / new tab on /system-settings/* would otherwise false-403).
 */
async function ensureAuthReady() {
  await bootstrapAuthentication()
  return useAuthStore.getState().auth
}

export function RequireAuth() {
  const auth = useAuthStore((state) => state.auth)
  if (!auth.user || !auth.accessToken) {
    return (
      <Navigate
        to={signInPathWithRedirect(
          window.location.href,
          window.location.origin
        )}
        replace
      />
    )
  }
  return <AuthenticatedLayout />
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const auth = useAuthStore((state) => state.auth)
  if (auth.user) {
    const params = new URLSearchParams(window.location.search)
    const target =
      sanitizeAuthRedirect(params.get('redirect'), window.location.origin) ??
      '/analytics/usage'
    return <Navigate to={target} replace />
  }
  return children
}

export function requireRole(minRole: number) {
  return async function roleLoader({ request }: LoaderFunctionArgs) {
    const auth = await ensureAuthReady()
    if (!auth.user || !auth.accessToken) {
      throw signInRedirect(request.url)
    }
    if (auth.user.role < minRole) {
      throw redirect('/403')
    }
    return null
  }
}

export function requireSuperAdmin() {
  return async function superAdminLoader({ request }: LoaderFunctionArgs) {
    const auth = await ensureAuthReady()
    if (!auth.user || !auth.accessToken) {
      throw signInRedirect(request.url)
    }
    if (auth.user.role !== ROLE.SUPER_ADMIN) {
      throw redirect('/403')
    }
    return null
  }
}

export function requireSection(valid: readonly string[], fallbackPath: string) {
  return function sectionLoader({ params }: LoaderFunctionArgs) {
    if (!params.section || !valid.includes(params.section)) {
      throw redirect(fallbackPath)
    }
    return null
  }
}

export async function moduleAccessLoader(
  module: 'pricing' | 'rankings',
  request: Request
) {
  const access = await getFreshModuleAccess(module)
  if (!access.enabled) throw redirect('/')
  if (access.requireAuth) {
    const auth = await ensureAuthReady()
    if (!auth.user) {
      throw signInRedirect(request.url)
    }
  }
  return null
}

export function playgroundLoader() {
  if (!isSidebarModuleEnabled('chat', 'playground')) {
    throw redirect('/analytics/usage')
  }
  return null
}

export function SuperAdminLayout() {
  const auth = useAuthStore((state) => state.auth)
  if (auth.user?.role !== ROLE.SUPER_ADMIN) {
    return <Navigate to='/403' replace />
  }
  return <Outlet />
}
