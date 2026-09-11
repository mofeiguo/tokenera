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
import { render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

const { QueryClient, QueryClientProvider } = await import('@/lib/query')
const { api } = await import('@/lib/api')
const { useAnalyticsData } = await import('../use-analytics-data')

type ApiGet = (
  url: string,
  config?: { params?: Record<string, unknown> }
) => Promise<{ data: unknown }>
const apiClient = api as unknown as { get: ApiGet }
const originalGet = apiClient.get
const requested: Array<{ url: string; params?: Record<string, unknown> }> = []

afterEach(() => {
  apiClient.get = originalGet
  requested.length = 0
})

function Probe() {
  useAnalyticsData({
    start_timestamp: new Date('2026-09-04T00:00:00'),
    end_timestamp: new Date('2026-09-11T23:59:59'),
    time_granularity: 'hour',
    username: 'should-not-be-sent',
    modelName: '',
  })
  return null
}

describe('useAnalyticsData', () => {
  test('loads the current user quota endpoint without username or admin scope', async () => {
    apiClient.get = async (url, config) => {
      requested.push({ url, params: config?.params })
      return { data: { data: [] } }
    }

    render(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })
        }
      >
        <Probe />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(requested.length).toBeGreaterThan(0)
    })

    expect(requested[0]?.url).toBe('/api/data/self')
    expect(requested[0]?.params?.username).toBeUndefined()
    expect(requested.some((item) => item.url === '/api/data')).toBe(false)
  })
})
