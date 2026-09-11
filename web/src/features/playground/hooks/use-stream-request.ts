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
import { useCallback, useEffect, useRef, useState } from 'react'
import { SSE } from 'sse.js'

import { getFreshAuthHeaders } from '@/lib/api'

import { ERROR_MESSAGES } from '../constants'
import {
  getStreamReadyStateError,
  isStreamClosedReadyState,
  isStreamDoneMessage,
  isStreamTerminalMessage,
  parseStreamErrorDetails,
  parseStreamMessageUpdates,
  shouldCompleteOnStreamClose,
  forwardNamedSseEventsAsMessage,
} from '../lib'
import type { PlaygroundRequest } from '../lib/streaming/payload-builder'

interface StreamEventSource {
  readyState?: number
  addEventListener: (
    type: string,
    listener: (event: Event & { data?: string; readyState?: number }) => void
  ) => void
  close: () => void
  stream: () => void
  dispatchEvent?: (event: Event) => boolean
}

interface StreamRequestCallbacks {
  onUpdate: (type: 'reasoning' | 'content', chunk: string) => void
  onComplete: () => void
  onError: (error: string, errorCode?: string) => void
}

interface StreamRequestControllerRuntime {
  getHeaders: () => Promise<Record<string, string>>
  createSource: (
    request: PlaygroundRequest,
    headers: Record<string, string>
  ) => StreamEventSource
  setStreaming: (streaming: boolean) => void
}

export function createStreamRequestController(
  runtime: StreamRequestControllerRuntime
) {
  let source: StreamEventSource | null = null
  let generation = 0

  const closeActiveSource = (target: StreamEventSource) => {
    target.close()
    if (source === target) {
      source = null
      runtime.setStreaming(false)
    }
  }

  const send = async (
    request: PlaygroundRequest,
    callbacks: StreamRequestCallbacks
  ) => {
    const requestGeneration = generation + 1
    generation = requestGeneration
    const previousSource = source
    source = null
    previousSource?.close()
    runtime.setStreaming(false)

    let headers: Record<string, string>
    try {
      headers = await runtime.getHeaders()
    } catch (error: unknown) {
      if (generation !== requestGeneration) return
      callbacks.onError(
        error instanceof Error
          ? error.message
          : ERROR_MESSAGES.STREAM_START_ERROR
      )
      return
    }
    if (generation !== requestGeneration) return

    const createdSource = runtime.createSource(request, headers)
    const nextSource =
      typeof createdSource.dispatchEvent === 'function'
        ? forwardNamedSseEventsAsMessage(
            createdSource as StreamEventSource & {
              dispatchEvent: (event: Event) => boolean
            }
          )
        : createdSource
    source = nextSource
    runtime.setStreaming(true)
    let completed = false

    const isCurrent = () =>
      generation === requestGeneration && source === nextSource

    const handleError = (errorMessage: string, errorCode?: string) => {
      if (!isCurrent() || completed) return
      completed = true
      callbacks.onError(errorMessage, errorCode)
      closeActiveSource(nextSource)
    }

    nextSource.addEventListener('message', (event) => {
      if (!isCurrent() || completed) return
      const data = event.data ?? ''
      if (isStreamDoneMessage(data)) {
        completed = true
        closeActiveSource(nextSource)
        callbacks.onComplete()
        return
      }

      try {
        const updates = parseStreamMessageUpdates(data)

        for (const update of updates) {
          callbacks.onUpdate(update.type, update.chunk)
        }

        if (isStreamTerminalMessage(data)) {
          completed = true
          closeActiveSource(nextSource)
          callbacks.onComplete()
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to parse SSE message:', error)
        handleError(ERROR_MESSAGES.PARSE_ERROR)
      }
    })

    nextSource.addEventListener('error', (event) => {
      if (!isCurrent() || completed) return
      if (!isStreamClosedReadyState(nextSource.readyState)) {
        // eslint-disable-next-line no-console
        console.error('SSE Error:', event)
        const { errorCode, errorMessage } = parseStreamErrorDetails(event.data)
        handleError(errorMessage, errorCode)
      }
    })

    nextSource.addEventListener('readystatechange', (event) => {
      if (!isCurrent() || completed) return
      const errorMessage = getStreamReadyStateError(
        event.readyState,
        nextSource
      )

      if (errorMessage) {
        handleError(errorMessage)
        return
      }

      if (shouldCompleteOnStreamClose(event.readyState, nextSource)) {
        completed = true
        closeActiveSource(nextSource)
        callbacks.onComplete()
      }
    })

    try {
      if (!isCurrent()) return
      nextSource.stream()
    } catch (error: unknown) {
      if (!isCurrent() || completed) return
      // eslint-disable-next-line no-console
      console.error('Failed to start SSE stream:', error)
      handleError(ERROR_MESSAGES.STREAM_START_ERROR)
    }
  }

  const cancel = (notify: boolean) => {
    generation += 1
    const activeSource = source
    source = null
    activeSource?.close()
    if (notify) runtime.setStreaming(false)
  }

  const stop = () => cancel(true)
  const dispose = () => cancel(false)

  return { send, stop, dispose }
}

/**
 * Hook for handling streaming chat completion requests
 */
export function useStreamRequest() {
  const [isStreaming, setIsStreaming] = useState(false)
  const controllerRef = useRef<ReturnType<
    typeof createStreamRequestController
  > | null>(null)
  if (!controllerRef.current) {
    controllerRef.current = createStreamRequestController({
      getHeaders: getFreshAuthHeaders,
      createSource: (request, headers) =>
        new SSE(request.url, {
          autoReconnect: false,
          headers,
          method: 'POST',
          payload: JSON.stringify(request.payload),
        }) as unknown as StreamEventSource,
      setStreaming: setIsStreaming,
    })
  }

  const sendStreamRequest = useCallback(
    (
      payload: PlaygroundRequest,
      onUpdate: (type: 'reasoning' | 'content', chunk: string) => void,
      onComplete: () => void,
      onError: (error: string, errorCode?: string) => void
    ) =>
      controllerRef.current?.send(payload, {
        onUpdate,
        onComplete,
        onError,
      }),
    []
  )

  const stopStream = useCallback(() => {
    controllerRef.current?.stop()
  }, [])

  useEffect(
    () => () => {
      controllerRef.current?.dispose()
    },
    []
  )

  return {
    sendStreamRequest,
    stopStream,
    isStreaming,
  }
}
