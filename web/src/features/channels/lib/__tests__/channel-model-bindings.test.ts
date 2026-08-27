import { describe, expect, test } from 'vitest'

import { groupChannelBindingsByUpstream } from '../channel-model-bindings'

describe('groupChannelBindingsByUpstream', () => {
  test('groups multiple public models under the same upstream model', () => {
    const groups = groupChannelBindingsByUpstream([
      {
        channel_id: 1,
        upstream_model: 'deepseek-chat',
        enabled: true,
        model_name: 'deepseek-v4-flash',
      },
      {
        channel_id: 1,
        upstream_model: 'deepseek-chat',
        enabled: false,
        model_name: 'deepseek-lite',
      },
      {
        channel_id: 1,
        upstream_model: 'gpt-4o-mini',
        enabled: true,
        model_name: 'gpt-4o-mini',
      },
    ])

    expect(groups).toHaveLength(2)
    expect(groups[0]?.upstreamModel).toBe('deepseek-chat')
    expect(groups[0]?.bindings.map((binding) => binding.model_name)).toEqual([
      'deepseek-lite',
      'deepseek-v4-flash',
    ])
    expect(groups[1]?.upstreamModel).toBe('gpt-4o-mini')
  })

  test('ignores bindings without upstream model names', () => {
    const groups = groupChannelBindingsByUpstream([
      {
        channel_id: 1,
        upstream_model: '   ',
        enabled: true,
        model_name: 'ignored',
      },
    ])

    expect(groups).toEqual([])
  })
})
