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
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  type MouseEvent,
  type ReactNode,
} from 'react'
/* eslint-disable react/only-export-components */
import {
  Link as RouterLink,
  Outlet,
  redirect as rrRedirect,
  useBlocker as useRRBlocker,
  useLocation as useRRLocation,
  useMatches,
  useNavigate as useRRNavigate,
  useNavigation,
  useParams as useRRParams,
  useSearchParams,
  type LinkProps as RouterLinkProps,
} from 'react-router'

export { Outlet }

export type SearchRecord = Record<string, unknown>

export function parseSearchString(search: string): SearchRecord {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search
  )
  const result: SearchRecord = {}
  params.forEach((raw, key) => {
    const value = decodeSearchValue(raw)
    if (key in result) {
      const current = result[key]
      result[key] = Array.isArray(current)
        ? [...current, value]
        : [current, value]
    } else {
      result[key] = value
    }
  })
  return result
}

function decodeSearchValue(raw: string): unknown {
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (raw === '') return ''
  if (
    (raw.startsWith('[') && raw.endsWith(']')) ||
    (raw.startsWith('{') && raw.endsWith('}'))
  ) {
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw)
  return raw
}

export function serializeSearch(search: SearchRecord | undefined): string {
  if (!search) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      params.set(key, JSON.stringify(value))
      continue
    }
    params.set(key, String(value))
  }
  const encoded = params.toString()
  return encoded ? `?${encoded}` : ''
}

export function interpolatePath(
  to: string,
  params?: Record<string, unknown>
): string {
  return to.replaceAll(/\$(\w+)/g, (_, key: string) => {
    const value = params?.[key]
    return value == null ? '' : String(value)
  })
}

export type NavigateOptions = {
  to?: string
  href?: string
  params?: Record<string, unknown>
  search?:
    | true
    | SearchRecord
    | ((prev: SearchRecord) => SearchRecord | Partial<SearchRecord>)
  replace?: boolean
  hash?: string
}

function resolveNavigateTarget(
  options: NavigateOptions,
  currentSearch: string,
  currentPathname: string
): string {
  if (options.href) {
    try {
      const url = new URL(options.href, window.location.origin)
      if (url.origin === window.location.origin) {
        return `${url.pathname}${url.search}${url.hash}`
      }
    } catch {
      /* fall through */
    }
    return options.href
  }

  const pathname = interpolatePath(
    options.to ?? currentPathname,
    options.params
  )
  let search = currentSearch
  if (options.search === true) {
    search = currentSearch
  } else if (typeof options.search === 'function') {
    const next = options.search(parseSearchString(currentSearch))
    search = serializeSearch(next as SearchRecord)
  } else if (options.search) {
    search = serializeSearch(options.search)
  } else if (options.to) {
    search = ''
  }
  const hash = options.hash ? `#${options.hash.replace(/^#/, '')}` : ''
  return `${pathname}${search}${hash}`
}

export function useNavigate() {
  const navigate = useRRNavigate()
  const location = useRRLocation()

  return useCallback(
    (options: NavigateOptions) => {
      const target = resolveNavigateTarget(
        options,
        location.search,
        location.pathname
      )
      void navigate(target, { replace: options.replace })
    },
    [location.pathname, location.search, navigate]
  )
}

export function useSearch<TSearch = any>(_opts?: { from?: string }): TSearch {
  const [params] = useSearchParams()
  return useMemo(
    () => parseSearchString(params.toString()) as TSearch,
    [params]
  )
}

export function useParams<T = Record<string, string | undefined>>(_opts?: {
  from?: string
}): T {
  return useRRParams() as T
}

export function useLocation<
  T = { pathname: string; href: string; search: string },
>(opts?: {
  select?: (location: { pathname: string; href: string; search: string }) => T
}): T {
  const location = useRRLocation()
  const mapped = {
    pathname: location.pathname,
    search: location.search,
    href: `${location.pathname}${location.search}${location.hash}`,
  }
  return (opts?.select ? opts.select(mapped) : mapped) as T
}

export function useRouter() {
  const navigate = useRRNavigate()
  return {
    history: {
      go: (delta: number) => {
        void navigate(delta)
      },
    },
  }
}

export function useRouterState<
  T = {
    status: string
    location: { pathname: string }
    matches: { routeId: string }[]
  },
>(opts?: {
  select?: (state: {
    status: string
    location: { pathname: string }
    matches: { routeId: string }[]
  }) => T
}): T {
  const navigation = useNavigation()
  const location = useRRLocation()
  const matches = useMatches()
  const state = {
    status: navigation.state === 'idle' ? 'idle' : 'pending',
    location: { pathname: location.pathname },
    matches: matches.map((match) => ({
      routeId: String(match.id || match.pathname),
    })),
  }
  return (opts?.select ? opts.select(state) : state) as T
}

export function getRouteApi(_path: string) {
  return {
    useSearch,
    useParams,
    useNavigate,
  }
}

export function redirect(options: NavigateOptions & { to?: string }): never {
  const search = typeof window === 'undefined' ? '' : window.location.search
  const pathname =
    typeof window === 'undefined' ? '/' : window.location.pathname
  throw rrRedirect(resolveNavigateTarget(options, search, pathname))
}

export function useBlocker(opts: {
  condition: boolean
  blockerFn?: () => boolean
}) {
  const { condition, blockerFn } = opts
  const blocker = useRRBlocker(condition)

  useEffect(() => {
    if (blocker.state !== 'blocked' || !blockerFn) return
    if (blockerFn()) blocker.proceed()
    else blocker.reset()
  }, [blocker, blockerFn])

  return {
    status: blocker.state === 'blocked' ? 'blocked' : blocker.state,
    proceed: blocker.proceed,
    reset: blocker.reset,
  }
}

export type LinkProps = Omit<RouterLinkProps, 'to'> & {
  to?: string
  href?: string
  params?: Record<string, unknown>
  search?: SearchRecord
  disabled?: boolean
  preload?: false | string
  children?: ReactNode
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  function Link(props, ref) {
    const {
      to,
      href,
      params,
      search,
      disabled,
      preload: _preload,
      onClick,
      ...rest
    } = props
    const location = useRRLocation()
    const target = href
      ? href
      : resolveNavigateTarget(
          { to: to ?? '.', params, search },
          location.search,
          location.pathname
        )

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault()
        return
      }
      onClick?.(event)
    }

    return (
      <RouterLink
        ref={ref}
        to={target}
        onClick={handleClick}
        aria-disabled={disabled || undefined}
        {...rest}
      />
    )
  }
)
