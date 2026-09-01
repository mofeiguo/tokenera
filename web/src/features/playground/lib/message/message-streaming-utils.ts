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
import { t } from 'i18next'

import { ERROR_MESSAGES, MESSAGE_ROLES, MESSAGE_STATUS } from '../../constants'
import type { ChatCompletionResponse, Message } from '../../types'
import { parseThinkTags } from './message-reasoning-utils'
import {
  completeAssistantTiming,
  completeReasoningTiming,
  startReasoningTiming,
} from './message-timing-utils'
import {
  getCurrentVersion,
  hasMessageContent,
  updateCurrentVersionContent,
} from './message-utils'

/**
 * Process content chunk during streaming.
 * Separates <think> reasoning from visible content in real-time.
 * Note: versions[0].content keeps the full raw content with tags during streaming.
 */
export function processStreamingContent(
  message: Message,
  contentChunk?: string
): Message {
  const currentVersion = getCurrentVersion(message)
  const fullContent = contentChunk
    ? currentVersion.content + contentChunk
    : currentVersion.content

  if (!message.reasoning && !fullContent.includes('<think>')) {
    return {
      ...updateCurrentVersionContent(message, fullContent),
      isReasoningStreaming: false,
    }
  }

  const { reasoning, hasUnclosedTag } = parseThinkTags(fullContent)
  const finalReasoning = reasoning
    ? {
        ...startReasoningTiming(message),
        content: reasoning,
      }
    : message.reasoning

  return {
    ...updateCurrentVersionContent(message, fullContent),
    reasoning: finalReasoning,
    isReasoningStreaming: hasUnclosedTag,
  }
}

export type StreamChunkType = 'reasoning' | 'content'

function getAppendableChunk(currentContent: string, chunk: string): string {
  if (!currentContent || !chunk.startsWith(currentContent)) {
    return chunk
  }

  return chunk.slice(currentContent.length)
}

export function applyStreamingChunk(
  message: Message,
  type: StreamChunkType,
  chunk: string
): Message {
  if (message.status === MESSAGE_STATUS.ERROR) {
    return message
  }

  if (type === 'reasoning') {
    const reasoning = startReasoningTiming(message)
    const appendableChunk = getAppendableChunk(reasoning.content, chunk)

    return {
      ...message,
      reasoning: {
        ...reasoning,
        content: reasoning.content + appendableChunk,
      },
      isReasoningStreaming: true,
      status: MESSAGE_STATUS.STREAMING,
    }
  }

  const currentVersion = getCurrentVersion(message)
  const appendableChunk = getAppendableChunk(currentVersion.content, chunk)
  const contentMessage = processStreamingContent(message, appendableChunk)

  return {
    ...(contentMessage.isReasoningStreaming
      ? contentMessage
      : completeReasoningTiming(contentMessage)),
    status: MESSAGE_STATUS.STREAMING,
  }
}

/**
 * Finalize message after streaming completes.
 * Cleans content and consolidates reasoning from all sources.
 */
export function finalizeMessage(
  message: Message,
  apiReasoningContent?: string
): Message {
  const currentVersion = getCurrentVersion(message)
  const parsedThinkTags = currentVersion.content.includes('<think>')
    ? parseThinkTags(currentVersion.content)
    : undefined
  const visibleContent =
    parsedThinkTags?.visibleContent ?? currentVersion.content
  const finalReasoning =
    apiReasoningContent ||
    message.reasoning?.content ||
    parsedThinkTags?.reasoning ||
    ''

  const finalized = {
    ...updateCurrentVersionContent(message, visibleContent),
    reasoning: finalReasoning
      ? {
          ...startReasoningTiming(message),
          content: finalReasoning,
        }
      : undefined,
    isReasoningStreaming: false,
  }

  return completeReasoningTiming(finalized)
}

export function completeAssistantMessage(message: Message): Message {
  return completeAssistantTiming({
    ...finalizeMessage(message),
    status: MESSAGE_STATUS.COMPLETE,
  })
}

export function isAssistantMessageFinal(message: Message): boolean {
  return (
    message.status === MESSAGE_STATUS.COMPLETE ||
    message.status === MESSAGE_STATUS.ERROR
  )
}

export function isAssistantMessagePending(message: Message): boolean {
  return (
    message.status === MESSAGE_STATUS.LOADING ||
    message.status === MESSAGE_STATUS.STREAMING
  )
}

export function isPendingAssistantMessage(message?: Message): boolean {
  return Boolean(
    message?.from === MESSAGE_ROLES.ASSISTANT &&
    isAssistantMessagePending(message)
  )
}

type ChatCompletionChoice = ChatCompletionResponse['choices'][number]

export type PlaygroundAssistantOutput = {
  content: string
  reasoning?: string
}

export function hasChatCompletionChoice(response: unknown): boolean {
  return Boolean(getPlaygroundAssistantOutput(response))
}

export function applyChatCompletionChoice(
  message: Message,
  choice: ChatCompletionChoice
): Message {
  return completeAssistantTiming({
    ...finalizeMessage(
      updateCurrentVersionContent(message, choice.message?.content || ''),
      choice.message?.reasoning_content
    ),
    status: MESSAGE_STATUS.COMPLETE,
  })
}

export function getPlaygroundAssistantOutput(
  response: unknown
): PlaygroundAssistantOutput | null {
  if (!response || typeof response !== 'object') {
    return null
  }
  const payload = response as Record<string, unknown>

  const choice = Array.isArray(payload.choices)
    ? (payload.choices[0] as ChatCompletionChoice | undefined)
    : undefined
  if (choice?.message) {
    return {
      content: choice.message.content || '',
      reasoning: choice.message.reasoning_content,
    }
  }

  if (typeof payload.output_text === 'string' && payload.output_text) {
    return { content: payload.output_text }
  }

  const responsesText = extractResponsesOutput(payload.output)
  if (responsesText !== null) {
    return responsesText
  }

  const anthropicText = extractAnthropicText(payload.content)
  if (anthropicText !== null) {
    return anthropicText
  }

  const geminiText = extractGeminiText(payload.candidates)
  if (geminiText !== null) {
    return geminiText
  }

  return null
}

function extractResponsesOutput(
  output: unknown
): PlaygroundAssistantOutput | null {
  if (!Array.isArray(output)) {
    return null
  }

  const texts: string[] = []
  const reasoning: string[] = []

  for (const item of output) {
    if (!item || typeof item !== 'object') {
      continue
    }
    const block = item as {
      type?: string
      role?: string
      content?: unknown
      summary?: unknown
    }
    if (block.type === 'reasoning') {
      collectResponsesText(reasoning, block.content)
      collectResponsesText(reasoning, block.summary)
      continue
    }
    if (block.type !== 'message') {
      continue
    }
    if (block.role && block.role !== 'assistant') {
      continue
    }
    collectResponsesText(texts, block.content)
  }

  if (texts.length === 0) {
    for (const item of output) {
      if (!item || typeof item !== 'object') {
        continue
      }
      collectResponsesText(
        texts,
        (item as { content?: unknown }).content
      )
    }
  }

  if (texts.length === 0 && reasoning.length === 0) {
    return null
  }
  return {
    content: texts.join(''),
    reasoning: reasoning.length > 0 ? reasoning.join('') : undefined,
  }
}

function collectResponsesText(target: string[], parts: unknown) {
  if (!Array.isArray(parts)) {
    return
  }
  for (const part of parts) {
    if (!part || typeof part !== 'object') {
      continue
    }
    const item = part as { type?: string; text?: string }
    if (!item.text) {
      continue
    }
    if (
      item.type &&
      item.type !== 'output_text' &&
      item.type !== 'summary_text' &&
      item.type !== 'reasoning_text'
    ) {
      continue
    }
    target.push(item.text)
  }
}

function extractAnthropicText(
  content: unknown
): PlaygroundAssistantOutput | null {
  if (!Array.isArray(content)) {
    return null
  }
  const texts: string[] = []
  const reasoning: string[] = []
  for (const block of content) {
    if (!block || typeof block !== 'object') {
      continue
    }
    const item = block as { type?: string; text?: string; thinking?: string }
    if (item.type === 'thinking' && item.thinking) {
      reasoning.push(item.thinking)
    }
    if (item.type === 'text' && item.text) {
      texts.push(item.text)
    }
  }
  if (texts.length === 0 && reasoning.length === 0) {
    return null
  }
  return {
    content: texts.join('\n'),
    reasoning: reasoning.length > 0 ? reasoning.join('\n') : undefined,
  }
}

function extractGeminiText(candidates: unknown): PlaygroundAssistantOutput | null {
  if (!Array.isArray(candidates)) {
    return null
  }
  const parts = (candidates[0] as { content?: { parts?: unknown[] } } | undefined)
    ?.content?.parts
  if (!Array.isArray(parts)) {
    return null
  }
  const texts: string[] = []
  const reasoning: string[] = []
  for (const part of parts) {
    if (!part || typeof part !== 'object') {
      continue
    }
    const item = part as { text?: string; thought?: boolean }
    if (!item.text) {
      continue
    }
    if (item.thought) {
      reasoning.push(item.text)
      continue
    }
    texts.push(item.text)
  }
  if (texts.length === 0 && reasoning.length === 0) {
    return null
  }
  return {
    content: texts.join(''),
    reasoning: reasoning.length > 0 ? reasoning.join('') : undefined,
  }
}

export function applyChatCompletionResponse(
  message: Message,
  response: unknown
): Message | null {
  const output = getPlaygroundAssistantOutput(response)

  if (!output) {
    return null
  }

  return completeAssistantTiming({
    ...finalizeMessage(
      updateCurrentVersionContent(message, output.content),
      output.reasoning
    ),
    status: MESSAGE_STATUS.COMPLETE,
  })
}

/**
 * Sanitize messages loaded from storage.
 * Converts stuck loading/streaming messages to stable state.
 */
export function sanitizeMessagesOnLoad(messages: Message[]): Message[] {
  let targetIndex = -1

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]

    if (isPendingAssistantMessage(message)) {
      targetIndex = i
      break
    }
  }

  if (targetIndex === -1) return messages

  const finalized = finalizeMessage(messages[targetIndex])
  const hasContent = hasMessageContent(finalized)
  const hasReasoning = finalized.reasoning?.content?.trim()

  const sanitized: Message =
    hasContent || hasReasoning
      ? completeAssistantTiming({
          ...finalized,
          status: MESSAGE_STATUS.COMPLETE,
          isReasoningStreaming: false,
        })
      : completeAssistantTiming({
          ...updateCurrentVersionContent(
            finalized,
            `${t(ERROR_MESSAGES.API_REQUEST_ERROR)}: ${t(
              ERROR_MESSAGES.INTERRUPTED
            )}`
          ),
          status: MESSAGE_STATUS.ERROR,
          isReasoningStreaming: false,
        })

  const result = [...messages]
  result[targetIndex] = sanitized
  return result
}
