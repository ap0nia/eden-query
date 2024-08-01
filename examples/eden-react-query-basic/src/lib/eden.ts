import {
  createEdenTreatyReactQuery,
  // type InferTreatyQueryInput,
  // type InferTreatyQueryOutput,
} from '@elysiajs/eden-react-query'

import type { App as ElysiaApp } from '../../server'

export const eden = createEdenTreatyReactQuery<ElysiaApp>()

// export type InferInput = InferTreatyQueryInput<App>
//
// export type InferOutput = InferTreatyQueryOutput<App>
