import {
  createEdenTreatyQuery,
  // httpLink,
  httpBatchLink,
  type InferTreatyQueryInput,
  type InferTreatyQueryOutput,
} from '@elysiajs/eden-svelte-query'
import SuperJSON from 'superjson'

import type { App } from '../server'

export const eden = createEdenTreatyQuery<App>({
  domain: '/api',
  keepDomain: true,
  links: [
    httpBatchLink({
      endpoint: '/api/batch',
      transformer: SuperJSON,
    }),
  ],
  abortOnUnmount: true,
})

export type InferInput = InferTreatyQueryInput<App>

export type InferOutput = InferTreatyQueryOutput<App>
