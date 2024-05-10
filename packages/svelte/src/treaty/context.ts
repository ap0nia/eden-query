import {
  type CancelOptions,
  type CreateInfiniteQueryOptions,
  type CreateQueryOptions,
  type FetchInfiniteQueryOptions,
  type FetchQueryOptions,
  type InfiniteData,
  type InvalidateOptions,
  type InvalidateQueryFilters,
  Query,
  QueryClient,
  type QueryFilters,
  type RefetchOptions,
  type ResetOptions,
  type SetDataOptions,
  type Updater,
  useQueryClient,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'

import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import type { InfiniteCursorKey, ReservedInfiniteQueryKeys } from '../internal/infinite'
import type { EdenRequestOptions, SvelteQueryProxyConfig } from '../internal/options'
import type { EdenQueryParams } from '../internal/params'
import { getQueryKey } from '../internal/query'
import type { DeepPartial } from '../utils/deep-partial'
import type { Override } from '../utils/override'
import type { TreatyQueryKey } from './types'

/**
 */
export type EdenTreatyQueryContext<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? TreatyContextHooksMapping<TSchema[K], [...TPath, K]>
    : InnerContextProxy<TSchema[K]>
} & RootContext

/**
 * Almost the same as {@link EdenTreatyQueryContext}, but extends {@link SharedContext}
 * instead of {@link RootContext}.
 */
type InnerContextProxy<TSchema extends Record<string, any>, TPath extends any[] = []> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? TreatyContextHooksMapping<TSchema[K], [...TPath, K]>
    : InnerContextProxy<TSchema[K]>
} & SharedContext

type RootContext = { queryClient: QueryClient } & SharedContext

type SharedContext = {
  invalidate: (filters?: InvalidateQueryFilters, opts?: InvalidateOptions) => Promise<void>
}

/**
 * Entrypoint for assigning utility hooks to a procedure.
 */
type TreatyContextHooksMapping<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TParams extends EdenQueryParams<any, TRoute> = EdenQueryParams<any, TRoute>,
> = TreatyQueryContext<TRoute, TPath> &
  (InfiniteCursorKey extends keyof (TParams['params'] & TParams['query'])
    ? TreatyInfiniteQueryContext<TRoute, TPath>
    : {})

/**
 * Hooks for query procedures.
 */
type TreatyQueryContext<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TParams extends EdenQueryParams<any, TRoute> = EdenQueryParams<any, TRoute>,
  TInput = InferRouteInput<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TEndpoint = TreatyQueryKey<TPath>,
> = {
  fetch: (
    input: TParams,
    options?: FetchQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>,
  ) => Promise<TOutput>

  prefetch: (
    input: TParams,
    options?: FetchQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>,
  ) => Promise<void>

  ensureData: (
    input: TParams,
    options?: FetchQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>,
  ) => Promise<TOutput>

  getData: (input: TParams) => TOutput | undefined

  setData: (
    input: TParams,
    updater: Updater<TOutput | undefined, TOutput | undefined>,
    options?: SetDataOptions,
  ) => void

  invalidate: (
    input?: DeepPartial<TParams>,
    filters?: Override<
      InvalidateQueryFilters,
      {
        predicate?: (query: Query<TOutput, TError, TOutput, [TEndpoint, TInput]>) => boolean
      }
    >,
    options?: InvalidateOptions,
  ) => Promise<void>

  refetch: (input?: TInput, filters?: QueryFilters, options?: RefetchOptions) => Promise<void>

  cancel: (input?: TInput, filters?: QueryFilters, options?: CancelOptions) => Promise<void>

  reset: (input?: TInput, filters?: QueryFilters, options?: ResetOptions) => Promise<void>

  options: (
    input: TInput,
    options?: CreateQueryOptions<TOutput, TError>,
  ) => CreateQueryOptions<TOutput, TError>
}

/**
 * Hooks for infinite query procedures.
 */
type TreatyInfiniteQueryContext<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TParams extends EdenQueryParams<any, TRoute, ReservedInfiniteQueryKeys> = EdenQueryParams<
    any,
    TRoute
  >,
  TInput = InferRouteInput<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TEndpoint = TreatyQueryKey<TPath>,
> = {
  fetchInfinite: (
    input: TParams,
    options?: FetchQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>,
  ) => Promise<InfiniteData<TOutput>>

  prefetchInfinite: (
    input: TParams,
    options?: FetchQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>,
  ) => Promise<void>

  getInfiniteData: (input: TInput) => InfiniteData<TOutput> | undefined

  setInfiniteData: (
    input: TParams,
    updater: Updater<InfiniteData<TOutput> | undefined, InfiniteData<TOutput> | undefined>,
    options?: SetDataOptions,
  ) => void

  infiniteOptions: (
    input: TParams,
    options?: CreateInfiniteQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>,
  ) => CreateInfiniteQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>
}

/**
 * Creates query utilities.
 */
export function createContext<TSchema extends Record<string, any>>(
  config?: SvelteQueryProxyConfig,
): EdenTreatyQueryContext<TSchema> {
  let fetch: any = {}

  const queryClient = config?.queryClient ?? useQueryClient()

  const context = {
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

  return context as any
}
