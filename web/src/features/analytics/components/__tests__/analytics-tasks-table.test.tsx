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
import { afterEach, describe, expect, test } from 'vitest'

const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { QueryClient, QueryClientProvider } = await import('@/lib/query')
const { api } = await import('@/lib/api')
const { AnalyticsTasksTable } = await import('../analytics-tasks-table')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        Time: 'Time',
        'Task ID': 'Task ID',
        Duration: 'Duration',
        Status: 'Status',
        Progress: 'Progress',
        Details: 'Details',
        Channel: 'Channel',
        User: 'User',
        Success: 'Success',
        kling: 'kling',
        'Image to Video': 'Image to Video',
        'Click to preview video': 'Click to preview video',
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

describe('analytics tasks table', () => {
  test('loads the current user tasks and hides channel fields', async () => {
    apiClient.get = async (url) => {
      requestedUrls.push(url)
      return {
        data: {
          data: {
            items: [
              {
                id: 21,
                user_id: 2,
                username: 'alice',
                platform: 'kling',
                task_id: 'task-preview-1',
                action: 'generate',
                channel_id: 88,
                submit_time: 1_778_000_000,
                finish_time: 1_778_000_040,
                progress: '100%',
                fail_reason: 'https://cdn.example/video.mp4',
                status: 'SUCCESS',
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
          <AnalyticsTasksTable
            filters={{
              start_timestamp: new Date('2026-09-04T00:00:00'),
              end_timestamp: new Date('2026-09-11T23:59:59'),
            }}
          />
        </I18nextProvider>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('task-preview-1')).toBeInTheDocument()
    })

    expect(screen.getByText('Success')).toBeInTheDocument()
    expect(screen.getByText('Click to preview video')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Channel' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'User' })).not.toBeInTheDocument()
    expect(screen.queryByText('alice')).not.toBeInTheDocument()
    expect(requestedUrls.some((url) => url.startsWith('/api/task/self?'))).toBe(
      true
    )
    expect(requestedUrls.some((url) => url.startsWith('/api/task?'))).toBe(false)
  })
})
