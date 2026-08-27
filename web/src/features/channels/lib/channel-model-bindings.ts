import type { ModelChannelBinding } from '@/features/models/types'

export type ChannelBindingGroup = {
  upstreamModel: string
  bindings: ModelChannelBinding[]
}

export function groupChannelBindingsByUpstream(
  bindings: ModelChannelBinding[]
): ChannelBindingGroup[] {
  const bindingsByUpstream = new Map<string, ModelChannelBinding[]>()

  for (const binding of bindings) {
    const upstreamModel = binding.upstream_model?.trim()
    if (!upstreamModel) continue
    const existing = bindingsByUpstream.get(upstreamModel) ?? []
    existing.push(binding)
    bindingsByUpstream.set(upstreamModel, existing)
  }

  return [...bindingsByUpstream.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([upstreamModel, groupedBindings]) => ({
      upstreamModel,
      bindings: [...groupedBindings].sort((left, right) =>
        (left.model_name ?? '').localeCompare(right.model_name ?? '')
      ),
    }))
}
