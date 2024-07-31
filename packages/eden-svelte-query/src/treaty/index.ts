import type { EdenLink } from '@elysiajs/eden'
import type { QueryClient } from '@tanstack/svelte-query'
import type { AnyElysia } from 'elysia'

import type { EdenQueryRequestOptions } from '../request'
import type { EdenTreatyQueryContext } from './context'
import type { EdenTreatyCreateQueries } from './create-queries'

type EdenTreatyGetContext<T extends AnyElysia> = () => EdenTreatyQueryContext<T>

type EdenTreatySetContext = (
  queryClient: QueryClient,
  configOverride?: EdenTreatyQueryConfig,
) => void

type EdenTreatyCreateContext<T extends AnyElysia> = (
  queryClient: QueryClient,
  configOverride?: EdenTreatyQueryConfig,
) => EdenTreatyQueryContext<T>

export type EdenTreatyQueryConfig<T extends AnyElysia = AnyElysia> = EdenQueryRequestOptions<T> & {
  links?: EdenLink[]
}

/**
 * Properties at the root of the eden treaty svelte-query proxy.
 */
export type EdenTreatyBase<T extends AnyElysia> = {
  /**
   * Get utilities from context. Only use within Svelte components.
   */
  getContext: EdenTreatyGetContext<T>

  /**
   * Create utilities and set the context. Only use within Svelte components.
   */
  setContext: EdenTreatySetContext

  /**
   * Create utilities without setting the context. Can be used outside of Svelte components,
   * e.g. load functions.
   */
  createContext: EdenTreatyCreateContext<T>

  /**
   */
  createQueries: EdenTreatyCreateQueries<T>
}
