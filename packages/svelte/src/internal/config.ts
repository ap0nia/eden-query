import type { RequestEvent } from '@sveltejs/kit'
import type { DehydratedState, QueryClient, StoreOrVal } from '@tanstack/svelte-query'
import type { MaybeArray, MaybePromise } from 'elysia/types'

import type { OperationLink } from '../links/operation'

export type EdenQueryRequestOptions = {
  /**
   * Whether the query should abort when the component unmounts.
   */
  abortOnUnmount?: boolean

  /**
   * Overrides for svelte-query hooks.
   */
  overrides?: EdenQueryOverrides

  /**
   * QueryClient to st
   */
  queryClient?: QueryClient
}

export type EdenQueryOverrides = {
  createMutation?: Partial<CreateMutationOverride>
}

export type CreateMutationOverride = {
  onSuccess: (opts: {
    originalFn: () => StoreOrVal<unknown>
    meta: Record<string, unknown>
  }) => MaybePromise<unknown>
}

/**
 * Per-request options to customize the fetch behavior.
 */
export type EdenRequestOptions = {
  links?: OperationLink[]
  fetch?: Omit<RequestInit, 'headers' | 'method'>
  fetcher?: typeof fetch
  headers?: MaybeArray<
    RequestInit['headers'] | ((path: string, options: RequestInit) => RequestInit['headers'] | void)
  >
  onRequest?: MaybeArray<(path: string, options: RequestInit) => MaybePromise<RequestInit | void>>
  onResponse?: MaybeArray<(response: Response) => MaybePromise<unknown>>
  keepDomain?: boolean
}

export type EdenSsrOptions = {
  event?: RequestEvent
  dehydrated?: DehydratedState | true
}

export type EdenQueryConfig = EdenRequestOptions & EdenQueryRequestOptions & EdenSsrOptions

export type EdenQueryConfigWithQueryClient = EdenQueryConfig & { queryClient: QueryClient }
