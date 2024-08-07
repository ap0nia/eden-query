import {
  createEdenTreatyQuery,
  type InferTreatyQueryInput,
  type InferTreatyQueryOutput,
} from '@elysiajs/eden-svelte-query'

import type { App } from '../server'

export const eden = createEdenTreatyQuery<App>({
  abortOnUnmount: true,
})

export type InferInput = InferTreatyQueryInput<App>

export type InferOutput = InferTreatyQueryOutput<App>
