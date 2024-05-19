import type { RequestEvent } from '@sveltejs/kit'
import type { DehydratedState, QueryClient, StoreOrVal } from '@tanstack/svelte-query'
import type { MaybeArray, MaybePromise } from 'elysia/types'

import type { OperationContext } from './operation'

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
 * Flexible format for defining headers.
 */
export type EdenRequestHeaders = MaybeArray<
  RequestInit['headers'] | ((path: string, options: RequestInit) => RequestInit['headers'] | void)
>

/**
 * Per-request options to customize the fetch behavior.
 */
export type EdenRequestOptions = {
  /**
   * Additional context shared between links.
   */
  context?: OperationContext

  /**
   * Signal that's forwarded to the fetch request to enable aborting.
   */
  signal?: AbortSignal

  /**
   * Fetch options.
   */
  fetchInit?: Omit<RequestInit, keyof EdenRequestOptions | 'method'>

  /**
   * Fetch implementation.
   */
  fetch?: typeof fetch

  /**
   * Headers object to forward to the fetch request.
   */
  headers?: EdenRequestHeaders

  /**
   * Callback to invoke prior to fetching the request.
   */
  onRequest?: MaybeArray<(path: string, options: RequestInit) => MaybePromise<RequestInit | void>>

  /**
   * Callback to invoke after fetching the request.
   */
  onResponse?: MaybeArray<(response: Response) => MaybePromise<unknown>>

  /**
   * IDK.
   */
  keepDomain?: boolean
}

export type EdenSsrOptions = {
  event?: RequestEvent
  dehydrated?: DehydratedState | true
}

export type EdenQueryConfig = EdenRequestOptions & EdenQueryRequestOptions & EdenSsrOptions

export type EdenQueryConfigWithQueryClient = EdenQueryConfig & { queryClient: QueryClient }
