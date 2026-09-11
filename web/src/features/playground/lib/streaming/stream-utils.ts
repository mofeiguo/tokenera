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
import { ERROR_MESSAGES } from '../../constants'
import type { ChatCompletionChunk } from '../../types'

const STREAM_DONE_MESSAGE = '[DONE]'
const STREAM_CLOSED_READY_STATE = 2

export type StreamUpdateType = 'reasoning' | 'content'

export type StreamMessageUpdate = {
  type: StreamUpdateType
  chunk: string
}

type StreamErrorPayload = {
  error?: {
    code?: string
    message?: string
  }
}

export type StreamErrorDetails = {
  errorCode?: string
  errorMessage: string
}

type StreamEventPayload = {
  type?: string
  delta?: unknown
  choices?: ChatCompletionChunk['choices']
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
        thought?: boolean
      }>
    }
  }>
}

function pushUpdate(
  updates: StreamMessageUpdate[],
  type: StreamUpdateType,
  chunk: string | undefined
) {
  if (!chunk) {
    return
  }
  updates.push({ type, chunk })
}

function parseOpenAIChatUpdates(
  payload: StreamEventPayload
): StreamMessageUpdate[] {
  const delta = payload.choices?.[0]?.delta
  if (!delta) {
    return []
  }

  const updates: StreamMessageUpdate[] = []
  pushUpdate(updates, 'reasoning', delta.reasoning_content)
  pushUpdate(updates, 'content', delta.content)
  return updates
}

function parseResponsesUpdates(
  payload: StreamEventPayload
): StreamMessageUpdate[] {
  const updates: StreamMessageUpdate[] = []
  if (
    payload.type === 'response.output_text.delta' &&
    typeof payload.delta === 'string'
  ) {
    pushUpdate(updates, 'content', payload.delta)
  }
  if (
    (payload.type === 'response.reasoning_text.delta' ||
      payload.type === 'response.reasoning_summary_text.delta') &&
    typeof payload.delta === 'string'
  ) {
    pushUpdate(updates, 'reasoning', payload.delta)
  }
  return updates
}

function parseAnthropicUpdates(
  payload: StreamEventPayload
): StreamMessageUpdate[] {
  if (payload.type !== 'content_block_delta' || !payload.delta) {
    return []
  }
  const delta = payload.delta as { type?: string; text?: string; thinking?: string }
  const updates: StreamMessageUpdate[] = []
  if (delta.type === 'thinking_delta') {
    pushUpdate(updates, 'reasoning', delta.thinking)
  }
  if (delta.type === 'text_delta') {
    pushUpdate(updates, 'content', delta.text)
  }
  return updates
}

function parseGeminiUpdates(
  payload: StreamEventPayload
): StreamMessageUpdate[] {
  const parts = payload.candidates?.[0]?.content?.parts
  if (!parts) {
    return []
  }
  const updates: StreamMessageUpdate[] = []
  for (const part of parts) {
    if (part.thought) {
      pushUpdate(updates, 'reasoning', part.text)
      continue
    }
    pushUpdate(updates, 'content', part.text)
  }
  return updates
}

export function parseStreamErrorDetails(data?: string): StreamErrorDetails {
  const fallbackMessage = data || ERROR_MESSAGES.API_REQUEST_ERROR

  if (!data) {
    return { errorMessage: fallbackMessage }
  }

  try {
    const parsed = JSON.parse(data) as StreamErrorPayload

    if (!parsed?.error) {
      return { errorMessage: fallbackMessage }
    }

    return {
      errorCode: parsed.error.code || undefined,
      errorMessage: parsed.error.message || fallbackMessage,
    }
  } catch {
    return { errorMessage: fallbackMessage }
  }
}

export function parseStreamMessageUpdates(data: string): StreamMessageUpdate[] {
  const payload = JSON.parse(data) as StreamEventPayload

  if (payload.choices) {
    return parseOpenAIChatUpdates(payload)
  }
  if (payload.type?.startsWith('response.')) {
    return parseResponsesUpdates(payload)
  }
  if (payload.type === 'content_block_delta') {
    return parseAnthropicUpdates(payload)
  }
  if (payload.candidates) {
    return parseGeminiUpdates(payload)
  }

  return []
}

const SSE_CONTROL_EVENT_TYPES = new Set([
  'error',
  'readystatechange',
  'abort',
  'open',
])

export type SseDispatchSource = {
  dispatchEvent: (event: Event) => boolean
}

export function forwardNamedSseEventsAsMessage<T extends SseDispatchSource>(
  source: T
): T {
  const originalDispatch = source.dispatchEvent.bind(source)
  source.dispatchEvent = (event: Event) => {
    if (
      event.type !== 'message' &&
      !SSE_CONTROL_EVENT_TYPES.has(event.type)
    ) {
      const data = (event as Event & { data?: string }).data
      if (typeof data === 'string') {
        originalDispatch(
          Object.assign(new Event('message'), { data }) as Event
        )
      }
    }
    return originalDispatch(event)
  }
  return source
}

export function isStreamDoneMessage(data: string): boolean {
  if (data === STREAM_DONE_MESSAGE) {
    return true
  }

  try {
    const parsed = JSON.parse(data) as { type?: string }
    return (
      parsed.type === 'message_stop' || parsed.type === 'response.completed'
    )
  } catch {
    return false
  }
}

export function isStreamTerminalMessage(data: string): boolean {
  try {
    const payload = JSON.parse(data) as {
      candidates?: Array<{ finishReason?: string | null }>
      promptFeedback?: { blockReason?: string | null }
    }

    if (
      Array.isArray(payload.candidates) &&
      payload.candidates.some(
        (candidate) =>
          typeof candidate.finishReason === 'string' &&
          candidate.finishReason.length > 0
      )
    ) {
      return true
    }

    if (
      typeof payload.promptFeedback?.blockReason === 'string' &&
      payload.promptFeedback.blockReason.length > 0
    ) {
      return true
    }

    return false
  } catch {
    return false
  }
}

export function isStreamClosedReadyState(readyState?: number): boolean {
  return readyState === STREAM_CLOSED_READY_STATE
}

export function getStreamReadyStateError(
  eventReadyState: number | undefined,
  source: unknown
): string | null {
  const status = (source as { status?: number }).status

  if (
    eventReadyState !== undefined &&
    eventReadyState >= STREAM_CLOSED_READY_STATE &&
    status !== undefined &&
    status !== 200
  ) {
    return `HTTP ${status}: ${ERROR_MESSAGES.CONNECTION_CLOSED}`
  }

  return null
}

export function shouldCompleteOnStreamClose(
  eventReadyState: number | undefined,
  source: unknown
): boolean {
  if (!isStreamClosedReadyState(eventReadyState)) {
    return false
  }
  const status = (source as { status?: number }).status
  return status === undefined || status === 200
}
