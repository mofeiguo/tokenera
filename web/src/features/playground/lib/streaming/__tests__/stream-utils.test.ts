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

import {
  isStreamDoneMessage,
  isStreamTerminalMessage,
  parseStreamMessageUpdates,
} from '../stream-utils'

describe('parseStreamMessageUpdates', () => {
  test('reads OpenAI chat deltas', () => {
    expect(
      parseStreamMessageUpdates(
        JSON.stringify({
          choices: [{ delta: { content: 'hi', reasoning_content: 'think' } }],
        })
      )
    ).toEqual([
      { type: 'reasoning', chunk: 'think' },
      { type: 'content', chunk: 'hi' },
    ])
  })

  test('reads Responses text deltas', () => {
    expect(
      parseStreamMessageUpdates(
        JSON.stringify({
          type: 'response.output_text.delta',
          delta: 'hello',
        })
      )
    ).toEqual([{ type: 'content', chunk: 'hello' }])
  })

  test('reads Responses reasoning summary deltas', () => {
    expect(
      parseStreamMessageUpdates(
        JSON.stringify({
          type: 'response.reasoning_summary_text.delta',
          delta: 'plan',
        })
      )
    ).toEqual([{ type: 'reasoning', chunk: 'plan' }])
  })

  test('reads Anthropic text deltas', () => {
    expect(
      parseStreamMessageUpdates(
        JSON.stringify({
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'bonjour' },
        })
      )
    ).toEqual([{ type: 'content', chunk: 'bonjour' }])
  })

  test('reads Gemini candidate parts', () => {
    expect(
      parseStreamMessageUpdates(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ thought: true, text: 'hmm' }, { text: 'ok' }] } },
          ],
        })
      )
    ).toEqual([
      { type: 'reasoning', chunk: 'hmm' },
      { type: 'content', chunk: 'ok' },
    ])
  })
})

describe('isStreamDoneMessage', () => {
  test('treats OpenAI, Anthropic, and Responses terminal events as done', () => {
    expect(isStreamDoneMessage('[DONE]')).toBe(true)
    expect(isStreamDoneMessage(JSON.stringify({ type: 'message_stop' }))).toBe(
      true
    )
    expect(
      isStreamDoneMessage(JSON.stringify({ type: 'response.completed' }))
    ).toBe(true)
    expect(isStreamDoneMessage(JSON.stringify({ type: 'content_block_delta' }))).toBe(
      false
    )
  })
})

describe('isStreamTerminalMessage', () => {
  test('identifies Gemini candidates with finishReason as terminal', () => {
    expect(
      isStreamTerminalMessage(
        JSON.stringify({
          candidates: [
            {
              content: { parts: [{ text: 'done' }] },
              finishReason: 'STOP',
            },
          ],
        })
      )
    ).toBe(true)
  })

  test('identifies Gemini promptFeedback blockReason as terminal', () => {
    expect(
      isStreamTerminalMessage(
        JSON.stringify({
          promptFeedback: { blockReason: 'SAFETY' },
        })
      )
    ).toBe(true)
  })

  test('returns false for non-terminal messages', () => {
    expect(
      isStreamTerminalMessage(
        JSON.stringify({
          candidates: [
            {
              content: { parts: [{ text: 'in progress' }] },
            },
          ],
        })
      )
    ).toBe(false)
    expect(isStreamTerminalMessage('invalid json')).toBe(false)
  })
})
