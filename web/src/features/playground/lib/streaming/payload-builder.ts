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
import { API_ENDPOINTS } from '../../constants'
import type {
  ChatCompletionMessage,
  Message,
  ParameterEnabled,
  PlaygroundConfig,
  PlaygroundEndpointType,
} from '../../types'
import { formatMessageForAPI, isValidMessage } from '../message/message-utils'

export type PlaygroundRequestPayload = Record<string, unknown>

export type PlaygroundRequest = {
  url: string
  payload: PlaygroundRequestPayload
}

function playgroundMessages(messages: Message[]): ChatCompletionMessage[] {
  return messages.filter(isValidMessage).map(formatMessageForAPI)
}

function applyScalarParameters(
  payload: PlaygroundRequestPayload,
  config: PlaygroundConfig,
  parameterEnabled: ParameterEnabled,
  keys: {
    temperature?: string
    topP?: string
    maxTokens?: string
    frequencyPenalty?: string
    presencePenalty?: string
    seed?: string
  }
) {
  if (parameterEnabled.temperature && keys.temperature) {
    payload[keys.temperature] = config.temperature
  }
  if (parameterEnabled.top_p && keys.topP) {
    payload[keys.topP] = config.top_p
  }
  if (parameterEnabled.max_tokens && keys.maxTokens) {
    payload[keys.maxTokens] = config.max_tokens
  }
  if (parameterEnabled.frequency_penalty && keys.frequencyPenalty) {
    payload[keys.frequencyPenalty] = config.frequency_penalty
  }
  if (parameterEnabled.presence_penalty && keys.presencePenalty) {
    payload[keys.presencePenalty] = config.presence_penalty
  }
  if (parameterEnabled.seed && config.seed !== null && keys.seed) {
    payload[keys.seed] = config.seed
  }
}

function splitSystemMessages(messages: ChatCompletionMessage[]): {
  instructions: string
  messages: ChatCompletionMessage[]
} {
  const instructions: string[] = []
  const rest: ChatCompletionMessage[] = []
  for (const message of messages) {
    if (message.role === 'system') {
      if (typeof message.content === 'string' && message.content.trim()) {
        instructions.push(message.content)
      }
      continue
    }
    rest.push(message)
  }
  return { instructions: instructions.join('\n\n'), messages: rest }
}

function messageText(content: ChatCompletionMessage['content']): string {
  if (typeof content === 'string') {
    return content
  }
  return content
    .filter((part) => part.type === 'text' && part.text)
    .map((part) => part.text)
    .join('\n')
}

function buildOpenAIPayload(
  messages: ChatCompletionMessage[],
  config: PlaygroundConfig,
  parameterEnabled: ParameterEnabled
): PlaygroundRequestPayload {
  const payload: PlaygroundRequestPayload = {
    model: config.model,
    group: config.group,
    messages,
    stream: config.stream,
  }
  applyScalarParameters(payload, config, parameterEnabled, {
    temperature: 'temperature',
    topP: 'top_p',
    maxTokens: 'max_tokens',
    frequencyPenalty: 'frequency_penalty',
    presencePenalty: 'presence_penalty',
    seed: 'seed',
  })
  return payload
}

function buildResponsesPayload(
  messages: ChatCompletionMessage[],
  config: PlaygroundConfig,
  parameterEnabled: ParameterEnabled
): PlaygroundRequestPayload {
  const split = splitSystemMessages(messages)
  const payload: PlaygroundRequestPayload = {
    model: config.model,
    input: split.messages,
    stream: config.stream,
  }
  if (split.instructions) {
    payload.instructions = split.instructions
  }
  applyScalarParameters(payload, config, parameterEnabled, {
    temperature: 'temperature',
    topP: 'top_p',
    maxTokens: 'max_output_tokens',
  })
  return payload
}

function buildAnthropicPayload(
  messages: ChatCompletionMessage[],
  config: PlaygroundConfig,
  parameterEnabled: ParameterEnabled
): PlaygroundRequestPayload {
  const split = splitSystemMessages(messages)
  const payload: PlaygroundRequestPayload = {
    model: config.model,
    messages: split.messages.map((message) => ({
      role: message.role,
      content: messageText(message.content),
    })),
    max_tokens: config.max_tokens,
    stream: config.stream,
  }
  if (split.instructions) {
    payload.system = split.instructions
  }
  applyScalarParameters(payload, config, parameterEnabled, {
    temperature: 'temperature',
    topP: 'top_p',
  })
  return payload
}

function buildGeminiPayload(
  messages: ChatCompletionMessage[],
  config: PlaygroundConfig,
  parameterEnabled: ParameterEnabled
): PlaygroundRequestPayload {
  const split = splitSystemMessages(messages)
  const generationConfig: Record<string, unknown> = {}
  applyScalarParameters(generationConfig, config, parameterEnabled, {
    temperature: 'temperature',
    topP: 'topP',
    maxTokens: 'maxOutputTokens',
  })

  const payload: PlaygroundRequestPayload = {
    contents: split.messages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: messageText(message.content) }],
    })),
  }
  if (split.instructions) {
    payload.systemInstruction = {
      parts: [{ text: split.instructions }],
    }
  }
  if (Object.keys(generationConfig).length > 0) {
    payload.generationConfig = generationConfig
  }
  return payload
}

function playgroundRequestUrl(
  endpointType: PlaygroundEndpointType,
  model: string,
  stream: boolean
): string {
  switch (endpointType) {
    case 'openai-response':
      return API_ENDPOINTS.RESPONSES
    case 'anthropic':
      return API_ENDPOINTS.MESSAGES
    case 'gemini': {
      const action = stream ? 'streamGenerateContent' : 'generateContent'
      return `/pg/models/${model}:${action}`
    }
    default:
      return API_ENDPOINTS.CHAT_COMPLETIONS
  }
}

export function buildPlaygroundRequest(
  messages: Message[],
  config: PlaygroundConfig,
  parameterEnabled: ParameterEnabled
): PlaygroundRequest {
  const processedMessages = playgroundMessages(messages)
  const endpointType = config.endpointType

  if (endpointType === 'openai-response') {
    return {
      url: playgroundRequestUrl(endpointType, config.model, config.stream),
      payload: buildResponsesPayload(
        processedMessages,
        config,
        parameterEnabled
      ),
    }
  }
  if (endpointType === 'anthropic') {
    return {
      url: playgroundRequestUrl(endpointType, config.model, config.stream),
      payload: buildAnthropicPayload(
        processedMessages,
        config,
        parameterEnabled
      ),
    }
  }
  if (endpointType === 'gemini') {
    return {
      url: playgroundRequestUrl(endpointType, config.model, config.stream),
      payload: buildGeminiPayload(processedMessages, config, parameterEnabled),
    }
  }

  return {
    url: playgroundRequestUrl('openai', config.model, config.stream),
    payload: buildOpenAIPayload(processedMessages, config, parameterEnabled),
  }
}
