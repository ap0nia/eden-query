import type { AnyElysia } from 'elysia'

import type { EdenQueryRequestOptions } from './integration/internal/query-request-options'

export type EdenQueryConfig<T extends AnyElysia = AnyElysia> = EdenQueryRequestOptions<T> & {
  /**
   * Override the default context provider
   * @default undefined
   */
  context?: any
}
