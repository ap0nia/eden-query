import type { QueryClient, StoreOrVal } from '@tanstack/svelte-query'
import type { MaybeArray, MaybePromise } from 'elysia/types'

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
export type EdenResolveOptions = {
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
 * All configuration options available to the fetch or treaty integrations.
 */
export type EdenQueryConfig = EdenResolveOptions & EdenQueryRequestOptions
