import { describe, expect, test } from 'vitest'

import { sortChannelBindings } from '../channel-model-bindings'

describe('sortChannelBindings', () => {
  test('returns a flat list of public models sorted by name', () => {
    const bindings = sortChannelBindings([
      {
        channel_id: 1,
        enabled: true,
        model_name: 'deepseek-v4-flash',
      },
      {
        channel_id: 1,
        enabled: false,
        model_name: 'deepseek-lite',
      },
      {
        channel_id: 2,
        enabled: true,
        model_name: 'gpt-4o-mini',
      },
    ])

    expect(bindings.map((binding) => binding.model_name)).toEqual([
      'deepseek-lite',
      'deepseek-v4-flash',
      'gpt-4o-mini',
    ])
  })

  test('keeps bindings that only have a channel and enabled flag', () => {
    const bindings = sortChannelBindings([
      {
        channel_id: 1,
        enabled: true,
      },
    ])

    expect(bindings).toEqual([
      {
        channel_id: 1,
        enabled: true,
      },
    ])
  })
})
