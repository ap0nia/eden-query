import {
  createEdenTreatyQuery,
  type InferTreatyQueryInput,
  type InferTreatyQueryIO,
  type InferTreatyQueryOutput,
} from '@ap0nia/eden-svelte-query'
import { dehydrate, type DehydratedState, type QueryClient } from '@tanstack/svelte-query'

import type { App } from '$lib/server'

export const eden = createEdenTreatyQuery<App>()

export type RouterInputs = InferTreatyQueryInput<App>

export type RouterOutputs = InferTreatyQueryOutput<App>

export type RouterIO = InferTreatyQueryIO<App>

export function mergeDyhdrated(
  target: DehydratedState,
  source: DehydratedState | QueryClient,
): DehydratedState {
  const dehydratedSource = 'mount' in source ? dehydrate(source) : source
  target.queries.push(...dehydratedSource.queries)
  target.mutations.push(...dehydratedSource.mutations)
  return target
}
