import {
  createEdenTreatyReactQuery,
  type InferTreatyQueryInput,
  type InferTreatyQueryOutput,
} from '@ap0nia/eden-react-query'

import type { App } from '../../server'

export const eden = createEdenTreatyReactQuery<App>({ abortOnUnmount: true })

export type InferInput = InferTreatyQueryInput<App>

export type InferOutput = InferTreatyQueryOutput<App>
