import type { ModelChannelBinding } from '@/features/models/types'

export function sortChannelBindings(
  bindings: ModelChannelBinding[]
): ModelChannelBinding[] {
  return [...bindings].sort((left, right) =>
    (left.model_name ?? '').localeCompare(right.model_name ?? '')
  )
}
