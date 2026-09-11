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
import { describe, expect, test } from 'vitest'

import type {
  Message,
  ParameterEnabled,
  PlaygroundConfig,
} from '../../../types'
import { buildPlaygroundRequest } from '../payload-builder'

const parameterEnabled: ParameterEnabled = {
  temperature: true,
  top_p: false,
  max_tokens: false,
  frequency_penalty: false,
  presence_penalty: false,
  seed: false,
}

const messages: Message[] = [
  {
    key: 'u1',
    from: 'user',
    versions: [{ id: 'v1', content: 'hello' }],
  },
]

function config(
  endpointType: PlaygroundConfig['endpointType']
): PlaygroundConfig {
  return {
    model: 'gpt-4o',
    endpointType,
    temperature: 0.7,
    top_p: 1,
    max_tokens: 4096,
    frequency_penalty: 0,
    presence_penalty: 0,
    seed: null,
    stream: true,
  }
}

describe('buildPlaygroundRequest', () => {
  test('sends OpenAI chat completions when the endpoint is openai', () => {
    const request = buildPlaygroundRequest(
      messages,
      config('openai'),
      parameterEnabled
    )

    expect(request.url).toBe('/pg/chat/completions')
    expect(request.payload.model).toBe('gpt-4o')
    expect(request.payload.messages).toEqual([
      { role: 'user', content: 'hello' },
    ])
    expect(request.payload.temperature).toBe(0.7)
  })

  test('sends Responses payload to /pg/responses', () => {
    const request = buildPlaygroundRequest(
      messages,
      config('openai-response'),
      parameterEnabled
    )

    expect(request.url).toBe('/pg/responses')
    expect(request.payload.input).toEqual([{ role: 'user', content: 'hello' }])
    expect(request.payload.messages).toBeUndefined()
  })

  test('sends Anthropic messages with required max_tokens', () => {
    const request = buildPlaygroundRequest(
      messages,
      config('anthropic'),
      parameterEnabled
    )

    expect(request.url).toBe('/pg/messages')
    expect(request.payload.max_tokens).toBe(4096)
    expect(request.payload.messages).toEqual([
      { role: 'user', content: 'hello' },
    ])
  })

  test('sends Gemini generateContent on the model path', () => {
    const request = buildPlaygroundRequest(
      messages,
      config('gemini'),
      parameterEnabled
    )

    expect(request.url).toBe('/pg/models/gpt-4o:streamGenerateContent')
    expect(request.payload.contents).toEqual([
      { role: 'user', parts: [{ text: 'hello' }] },
    ])
  })

  test('sends attached images as base64 across playground endpoints', () => {
    const imageMessages: Message[] = [
      {
        key: 'u1',
        from: 'user',
        versions: [{ id: 'v1', content: 'describe this' }],
        images: [
          {
            url: 'data:image/png;base64,aGVsbG8=',
            mediaType: 'image/png',
            filename: 'dot.png',
          },
        ],
      },
    ]

    const openai = buildPlaygroundRequest(
      imageMessages,
      config('openai'),
      parameterEnabled
    )
    expect(openai.payload.messages).toEqual([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'describe this' },
          {
            type: 'image_url',
            image_url: { url: 'data:image/png;base64,aGVsbG8=' },
          },
        ],
      },
    ])

    const responses = buildPlaygroundRequest(
      imageMessages,
      config('openai-response'),
      parameterEnabled
    )
    expect(responses.payload.input).toEqual([
      {
        role: 'user',
        content: [
          { type: 'input_text', text: 'describe this' },
          {
            type: 'input_image',
            image_url: 'data:image/png;base64,aGVsbG8=',
          },
        ],
      },
    ])

    const anthropic = buildPlaygroundRequest(
      imageMessages,
      config('anthropic'),
      parameterEnabled
    )
    expect(anthropic.payload.messages).toEqual([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'describe this' },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: 'aGVsbG8=',
            },
          },
        ],
      },
    ])

    const gemini = buildPlaygroundRequest(
      imageMessages,
      config('gemini'),
      parameterEnabled
    )
    expect(gemini.payload.contents).toEqual([
      {
        role: 'user',
        parts: [
          { text: 'describe this' },
          {
            inlineData: {
              mimeType: 'image/png',
              data: 'aGVsbG8=',
            },
          },
        ],
      },
    ])
  })
})
