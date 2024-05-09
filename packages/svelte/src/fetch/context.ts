import type { EdenFetch } from '@elysiajs/eden/fetch'
import {
  type CreateQueryOptions,
  type FetchInfiniteQueryOptions,
  type FetchQueryOptions,
  type InfiniteData,
  type InvalidateOptions,
  useQueryClient,
} from '@tanstack/svelte-query'
import type { Elysia } from 'elysia'

import type { HttpQueryMethod } from '../internal/http'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import type { InfiniteRoutes } from '../internal/infinite'
import type { EdenRequestOptions, SvelteQueryProxyConfig } from '../internal/options'
import { getQueryKey } from '../internal/query'
import type { Filter } from '../utils/filter'

export const EDEN_CONTEXT_KEY = Symbol('EDEN_CONTEXT_KEY')

export type EdenFetchQueryContext<TSchema extends Record<string, any>> = {
  invalidate: <
    TEndpoint extends keyof TSchema,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpQueryMethod>>,
    TRoute extends TSchema[TEndpoint][Lowercase<TMethod>],
  >(
    endpoint: TEndpoint,
    ...args: TEndpoint extends keyof Filter<TSchema, HttpQueryMethod>
      ? [input: EdenRequestOptions<TMethod, TRoute>, options?: InvalidateOptions]
      : [options?: InvalidateOptions]
  ) => void

  fetch: <
    TEndpoint extends keyof Filter<TSchema, HttpQueryMethod>,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpQueryMethod>>,
    TRoute extends TSchema[TEndpoint][Lowercase<TMethod>],
    TOutput = InferRouteOutput<TRoute>,
    TError = InferRouteError<TRoute>,
    TInput = InferRouteInput<TRoute>,
  >(
    endpoint: TEndpoint,
    input: EdenRequestOptions<TMethod, TRoute>,
    options?: FetchQueryOptions<TOutput, TError, TInput, [TEndpoint, TInput]>,
  ) => Promise<TOutput>

  fetchInfinite: <
    TEndpoint extends keyof InfiniteRoutes<TSchema>,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpQueryMethod>>,
    TRoute extends TSchema[TEndpoint][Lowercase<TMethod>],
    TOutput = InferRouteOutput<TRoute>,
    TError = InferRouteError<TRoute>,
    TInput = InferRouteInput<TRoute>,
  >(
    endpoint: TEndpoint,
    input: EdenRequestOptions<TMethod, TRoute>,
    options?: FetchInfiniteQueryOptions<TOutput, TError, TInput, [TEndpoint, TInput]>,
  ) => Promise<InfiniteData<TOutput>>
}

/**
 */
export function createContext<T extends Elysia<any, any, any, any, any, any, any, any>>(
  fetch: EdenFetch.Create<T>,
  config?: SvelteQueryProxyConfig,
) {
  const queryClient = config?.queryClient ?? useQueryClient()

  return {
    invalidate: (endpoint: string, input: any, options?: InvalidateOptions) => {
      queryClient.invalidateQueries(
        {
          queryKey: getQueryKey(endpoint, input),
        },
        options,
      )
    },
    fetch: (endpoint: string, input: any, options?: FetchQueryOptions) => {
      const abortOnUnmount = Boolean(config?.abortOnUnmount)

      const baseQueryOptions = {
        queryKey: getQueryKey(endpoint, input, 'query'),
        queryFn: async (context) => {
          return await fetch(
            endpoint as any,
            {
              ...input,
              signal: abortOnUnmount ? context.signal : undefined,
            } as EdenRequestOptions,
          )
        },
        ...options,
      } satisfies CreateQueryOptions

      return queryClient.fetchQuery(baseQueryOptions)
    },

    fetchInfinite: (endpoint: string, input: any, options?: FetchInfiniteQueryOptions) => {
      const abortOnUnmount = Boolean(config?.abortOnUnmount)

      const baseQueryOptions: FetchInfiniteQueryOptions = {
        initialPageParam: 0,
        queryKey: getQueryKey(endpoint, input, 'infinite'),
        queryFn: async (context) => {
          if (input.query) {
            input.query['cursor'] = context.pageParam
          }

          if (input.params) {
            input.params['cursor'] = context.pageParam
          }

          return await fetch(
            endpoint as any,
            {
              ...input,
              signal: abortOnUnmount ? context.signal : undefined,
            } as EdenRequestOptions,
          )
        },
        ...options,
      }

      return queryClient.fetchInfiniteQuery(baseQueryOptions)
    },
  }
}
