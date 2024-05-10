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
import type { Elysia, RouteSchema } from 'elysia'

import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import type { InfiniteCursorKey, ReservedInfiniteQueryKeys } from '../internal/infinite'
import type { EdenQueryParams } from '../internal/params'
import { getQueryKey } from '../internal/query'
import type { DeepPartial } from '../utils/deep-partial'
import type { Override } from '../utils/override'
import { resolveTreaty } from './resolve'
import type { EdenTreatyQueryConfig, TreatyQueryKey } from './types'

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

export function createInnerContext(
  domain?: string,
  config: EdenTreatyQueryConfig = {},
  queryClient = useQueryClient(),
  paths: string[] = [],
  elysia?: Elysia<any, any, any, any, any, any>,
) {
  const proxy = new Proxy(() => {}, {
    get(_, path: string): any {
      switch (path) {
        default: {
          return createInnerContext(
            domain,
            config,
            queryClient,
            path === 'index' ? paths : [...paths, path],
            elysia,
          )
        }
      }
    },
    apply(_, __, anyArgs) {
      const pathsCopy = [...paths]

      /**
       * @example 'fetch', 'invalidate'
       */
      const hook = pathsCopy.pop() ?? ''

      /**
       * @example 'get'
       */
      const method = pathsCopy.pop() ?? ''

      const endpoint = '/' + pathsCopy.join('/')

      const abortOnUnmount =
        Boolean(config?.abortOnUnmount) || Boolean(anyArgs[1]?.eden?.abortOnUnmount)

      const queryOptions = {
        queryKey: getQueryKey(endpoint, anyArgs[0], 'query'),
        queryFn: async (context) => {
          const result = await resolveTreaty(
            {
              ...anyArgs[0],
              method,
              signal: abortOnUnmount ? context.signal : undefined,
            },
            undefined,
            domain,
            config,
            paths,
            elysia,
          )
          return result
        },
        ...anyArgs[1],
      } satisfies FetchQueryOptions

      const infiniteQueryOptions = {
        queryKey: getQueryKey(endpoint, anyArgs[0], 'infinite'),
        queryFn: async (context) => {
          const options = { ...anyArgs[0] }

          // FIXME: scuffed way to set cursor.
          if (options.query) {
            options.query['cursor'] = context.pageParam
          }

          if (options.params) {
            options.params['cursor'] = context.pageParam
          }

          const result = await resolveTreaty(
            {
              ...options,
              method,
              signal: abortOnUnmount ? context.signal : undefined,
            },
            undefined,
            domain,
            config,
            paths,
            elysia,
          )
          return result
        },
        ...anyArgs[1],
      } satisfies FetchInfiniteQueryOptions

      // general query key used for invalidations, etc.
      const queryKey = getQueryKey(endpoint, anyArgs[0], 'any')

      switch (hook) {
        case 'options':
          return queryOptions

        case 'infiniteOptions':
          return infiniteQueryOptions

        case 'fetch':
          return queryClient.fetchQuery(queryOptions)

        case 'prefetch':
          return queryClient.prefetchQuery(queryOptions)

        case 'getData':
          return queryClient.getQueryData(queryOptions.queryKey)

        case 'ensureData':
          return queryClient.ensureQueryData(queryOptions)

        case 'setData':
          return queryClient.setQueryData(queryOptions.queryKey, anyArgs[1], anyArgs[2])

        case 'fetchInfinite':
          return queryClient.fetchInfiniteQuery(infiniteQueryOptions)

        case 'prefetchInfinite':
          return queryClient.prefetchInfiniteQuery(infiniteQueryOptions)

        case 'getInfiniteData':
          return queryClient.getQueryData(infiniteQueryOptions.queryKey)

        case 'ensureInfiniteData':
          return queryClient.ensureQueryData(infiniteQueryOptions)

        case 'setInfiniteData':
          return queryClient.setQueryData(infiniteQueryOptions.queryKey, anyArgs[0], anyArgs[1])

        case 'invalidate':
          return queryClient.invalidateQueries({ queryKey, ...anyArgs[0] }, anyArgs[1])

        case 'refetch':
          return queryClient.refetchQueries({ queryKey, ...anyArgs[0] }, anyArgs[1])

        case 'cancel':
          return queryClient.cancelQueries({ queryKey, ...anyArgs[0] }, anyArgs[1])

        case 'reset':
          return queryClient.resetQueries({ queryKey, ...anyArgs[0] }, anyArgs[1])

        default:
          throw new TypeError(`context.${paths.join('.')}.${hook} is not a function`)
      }
    },
  })
  return proxy as any
}

/**
 * Creates query utilities.
 */
export function createContext<TSchema extends Record<string, any>>(
  domain?: string,
  config: EdenTreatyQueryConfig = {},
  queryClient = useQueryClient(),
  paths: string[] = [],
  elysia?: Elysia<any, any, any, any, any, any>,
): EdenTreatyQueryContext<TSchema> {
  const innerProxy = createInnerContext(domain, config, queryClient, paths, elysia)

  const proxy = new Proxy(() => {}, {
    get(_, path: string): any {
      switch (path) {
        case 'queryClient': {
          return queryClient
        }
        default: {
          return innerProxy[path]
        }
      }
    },
  })
  return proxy as any
}
