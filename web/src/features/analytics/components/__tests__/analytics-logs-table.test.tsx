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
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/lib/lobe-icon', () => ({
  getLobeIcon: () => null,
}))

const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { QueryClient, QueryClientProvider } = await import('@/lib/query')
const { api } = await import('@/lib/api')
const { AnalyticsLogsTable } = await import('../analytics-logs-table')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        Time: 'Time',
        'API Key': 'API Key',
        Model: 'Model',
        Provider: 'Provider',
        Channel: 'Channel',
        'Input tokens': 'Input tokens',
        'Output tokens': 'Output tokens',
        'Cache Read': 'Cache Read',
        Cost: 'Cost',
        Stream: 'Stream',
        Latency: 'Latency',
        Throughput: 'Throughput',
        'Finish Reason': 'Finish Reason',
        Details: 'Details',
        Yes: 'Yes',
        No: 'No',
        'No data': 'No data',
      },
    },
  },
})

type ApiGet = (url: string) => Promise<{ data: unknown }>
const apiClient = api as unknown as { get: ApiGet }
const originalGet = apiClient.get
const requestedUrls: string[] = []

afterEach(() => {
  apiClient.get = originalGet
  requestedUrls.length = 0
})

describe('analytics logs table', () => {
  test('shows the public model and hides channel fields', async () => {
    apiClient.get = async (url) => {
      requestedUrls.push(url)
      return {
        data: {
          data: {
            items: [
              {
                id: 11,
                user_id: 2,
                created_at: 1_778_000_000,
                type: 2,
                content: '',
                username: 'alice',
                token_name: 'studio-key',
                model_name: 'gpt-4o',
                quota: 12,
                prompt_tokens: 20,
                completion_tokens: 8,
                use_time: 2,
                is_stream: true,
                channel: 88,
                channel_name: 'internal-channel-east',
                token_id: 3,
                ip: '127.0.0.1',
                other: '{}',
                request_id: 'req-1',
                upstream_request_id: 'up-1',
              },
            ],
            total: 1,
          },
        },
      }
    }

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <AnalyticsLogsTable
            filters={{
              start_timestamp: new Date('2026-09-04T00:00:00'),
              end_timestamp: new Date('2026-09-11T23:59:59'),
              time_granularity: 'hour',
              username: '',
              modelName: '',
            }}
          />
        </I18nextProvider>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('gpt-4o')).toBeInTheDocument()
    })

    expect(screen.getByRole('columnheader', { name: 'Model' })).toBeInTheDocument()
    expect(
      screen.queryByRole('columnheader', { name: 'Provider' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('columnheader', { name: 'Channel' })
    ).not.toBeInTheDocument()
    expect(screen.queryByText('internal-channel-east')).not.toBeInTheDocument()
    expect(requestedUrls.some((url) => url.startsWith('/api/log/self?'))).toBe(
      true
    )
    expect(requestedUrls.some((url) => url.startsWith('/api/log?'))).toBe(false)
  })
})
