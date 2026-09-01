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

import { getPlaygroundAssistantOutput } from '../message-streaming-utils'

describe('getPlaygroundAssistantOutput', () => {
  test('reads OpenAI chat completions', () => {
    expect(
      getPlaygroundAssistantOutput({
        choices: [
          {
            message: { content: 'hi', reasoning_content: 'think' },
          },
        ],
      })
    ).toEqual({ content: 'hi', reasoning: 'think' })
  })

  test('reads Responses output items when output_text is absent', () => {
    expect(
      getPlaygroundAssistantOutput({
        output: [
          {
            type: 'reasoning',
            summary: [{ type: 'summary_text', text: 'plan' }],
          },
          {
            type: 'message',
            role: 'assistant',
            content: [{ type: 'output_text', text: 'hello' }],
          },
        ],
      })
    ).toEqual({ content: 'hello', reasoning: 'plan' })
  })

  test('reads Anthropic content blocks', () => {
    expect(
      getPlaygroundAssistantOutput({
        content: [
          { type: 'thinking', thinking: 'hmm' },
          { type: 'text', text: 'bonjour' },
        ],
      })
    ).toEqual({ content: 'bonjour', reasoning: 'hmm' })
  })

  test('reads Gemini candidates', () => {
    expect(
      getPlaygroundAssistantOutput({
        candidates: [
          {
            content: {
              parts: [{ thought: true, text: 'hmm' }, { text: 'ok' }],
            },
          },
        ],
      })
    ).toEqual({ content: 'ok', reasoning: 'hmm' })
  })
})
