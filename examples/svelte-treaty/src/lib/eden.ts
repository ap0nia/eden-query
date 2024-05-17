import {
  createEdenTreatyQuery,
  httpBatchLink,
  type InferTreatyQueryInput,
  type InferTreatyQueryIO,
  type InferTreatyQueryOutput,
} from '@ap0nia/eden-svelte-query'

import type { App } from '$lib/server'

export const eden = createEdenTreatyQuery<App>(undefined, {
  links: [httpBatchLink()],
})

export type RouterInputs = InferTreatyQueryInput<App>

export type RouterOutputs = InferTreatyQueryOutput<App>

export type RouterIO = InferTreatyQueryIO<App>
