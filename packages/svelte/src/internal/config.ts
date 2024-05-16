import type { RequestEvent } from '@sveltejs/kit'
import type { DehydratedState, QueryClient, StoreOrVal } from '@tanstack/svelte-query'
import type { MaybeArray, MaybePromise } from 'elysia/types'

import type { OperationLink } from '../links/operation'

/**
 * Request options for svelte-query.
 */
export interface EdenQueryRequestOptions {
  overrides?: {
    createMutation?: Partial<CreateMutationOverride>
  }
  abortOnUnmount?: boolean
  queryClient?: QueryClient
}

export interface CreateMutationOverride {
  onSuccess: (opts: {
    originalFn: () => StoreOrVal<unknown>
    meta: Record<string, unknown>
  }) => MaybePromise<unknown>
}

/**
 * Options for resolving eden requests.
 */
export type EdenResolveConfig = {
  fetch?: Omit<RequestInit, 'headers' | 'method'>
  fetcher?: typeof fetch
  headers?: MaybeArray<
    RequestInit['headers'] | ((path: string, options: RequestInit) => RequestInit['headers'] | void)
  >
  onRequest?: MaybeArray<(path: string, options: RequestInit) => MaybePromise<RequestInit | void>>
  onResponse?: MaybeArray<(response: Response) => MaybePromise<unknown>>
  keepDomain?: boolean
}

/**
 * Options available when targetting SSR.
 */
export type EdenSsrOptions = {
  event?: RequestEvent

  /**
   * Dehydrate the SSR queryClient, and pass a pointer to the object or `true` to initialize a new one.
   * Completed queries will be merged with this dehdrated state.
   */
  dehydrated?: DehydratedState | true
}

export type EdenLinksConfig = {
  links?: OperationLink[]
}

/**
 * All configuration options available to the fetch or treaty integrations.
 */
export type EdenQueryConfig = EdenResolveConfig &
  EdenQueryRequestOptions &
  EdenSsrOptions &
  EdenLinksConfig

export type EdenQueryConfigWithQueryClient = EdenQueryConfig & { queryClient: QueryClient }
