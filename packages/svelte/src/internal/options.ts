import type { QueryClient, StoreOrVal } from '@tanstack/svelte-query'

import type { IsNever } from '../utils/is-never'
import type { IsUnknown } from '../utils/is-unknown'
import type { MaybePromise } from '../utils/promise'

export interface EdenQueryProxyConfig {
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

export type EdenRequestOptions<
  TMethod extends string = any,
  TRoute extends Record<string, any> = any,
  /**
   * Utility generic for filtering out certain properties from all input sources.
   */
  TOmitInput extends string | number | symbol = never,
> = Omit<RequestInit, 'body' | 'method' | 'headers'> &
  ('GET' extends TMethod
    ? {
        method?: TMethod
      }
    : {
        method: TMethod
      }) &
  (IsNever<keyof TRoute['params']> extends true
    ? {
        params?: Record<never, string>
      }
    : {
        params: Omit<TRoute['params'], TOmitInput>
      }) &
  (IsNever<keyof TRoute['query']> extends true
    ? {
        query?: Record<never, string>
      }
    : {
        query: Omit<TRoute['query'], TOmitInput>
      }) &
  (undefined extends TRoute['headers']
    ? {
        headers?: Record<string, string>
      }
    : {
        headers: TRoute['headers']
      }) &
  (IsUnknown<TRoute['body']> extends false
    ? {
        body: Omit<TRoute['body'], TOmitInput>
      }
    : {
        body?: unknown
      }) & {
    eden?: EdenQueryProxyConfig
  }
