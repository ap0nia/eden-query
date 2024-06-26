import {
  createEdenTreatyQuery,
  httpLink,
  type InferTreatyQueryInput,
  type InferTreatyQueryIO,
  type InferTreatyQueryOutput,
} from '@ap0nia/eden-svelte-query'

import type { App } from '$lib/server'

export const eden = createEdenTreatyQuery<App>({
  links: [httpLink()],
})

export type RouterInputs = InferTreatyQueryInput<App>

export type RouterOutputs = InferTreatyQueryOutput<App>

export type RouterIO = InferTreatyQueryIO<App>
