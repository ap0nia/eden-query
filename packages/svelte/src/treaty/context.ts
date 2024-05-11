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

import { httpMethods } from '../internal/http'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import type { InfiniteCursorKey, ReservedInfiniteQueryKeys } from '../internal/infinite'
import type { EdenQueryParams } from '../internal/params'
import { getQueryKey, type QueryType } from '../internal/query'
import type { DeepPartial } from '../utils/deep-partial'
import { noop } from '../utils/noop'
import type { Override } from '../utils/override'
import { resolveTreaty } from './resolve'
import type { EdenTreatyQueryConfig, TreatyQueryKey } from './types'

/**
 */
export type EdenTreatyQueryContext<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = RootContext & {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? TreatyContextHooksMapping<TSchema[K], [...TPath, K]>
    : InnerContextProxy<TSchema[K]>
}

/**
 * Almost the same as {@link EdenTreatyQueryContext}, but extends {@link SharedContext}
 * instead of {@link RootContext}.
 */
export type InnerContextProxy<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = SharedContext & {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? TreatyContextHooksMapping<TSchema[K], [...TPath, K]>
    : InnerContextProxy<TSchema[K]>
}

/**
 */
type RootContext = SharedContext & { queryClient: QueryClient }

/**
 */
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

export function createTreatyQueryOptions(
  paths: string[],
  anyArgs: any,
  domain?: string,
  config: EdenTreatyQueryConfig = {},
  elysia?: Elysia<any, any, any, any, any, any>,
): FetchQueryOptions {
  /**
   */
  const pathsCopy: any[] = [...paths]

  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  const method = pathsCopy[pathsCopy.length - 1]

  if (httpMethods.includes(method)) {
    pathsCopy.pop()
  }

  const abortOnUnmount =
    Boolean(config?.abortOnUnmount) || Boolean(anyArgs[1]?.eden?.abortOnUnmount)

  const queryOptions = {
    queryKey: getQueryKey(pathsCopy, anyArgs[0], 'query'),
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

  return queryOptions
}

export function createTreatyInfiniteQueryOptions(
  paths: string[],
  anyArgs: any,
  domain?: string,
  config: EdenTreatyQueryConfig = {},
  elysia?: Elysia<any, any, any, any, any, any>,
): FetchInfiniteQueryOptions {
  /**
   */
  const pathsCopy: any[] = [...paths]

  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  const method = pathsCopy[pathsCopy.length - 1]

  if (httpMethods.includes(method)) {
    pathsCopy.pop()
  }

  const abortOnUnmount =
    Boolean(config?.abortOnUnmount) || Boolean(anyArgs[1]?.eden?.abortOnUnmount)

  const infiniteQueryOptions = {
    queryKey: getQueryKey(pathsCopy, anyArgs[0], 'infinite'),
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

  return infiniteQueryOptions
}

export function createTreatyQueryKey(paths: string[], anyArgs: any, type: QueryType = 'any') {
  const pathsCopy: any[] = [...paths]

  /**
   * Pop the hook.
   * @example 'fetch', 'invalidate'
   */
  pathsCopy.pop() ?? ''

  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  const method = pathsCopy[pathsCopy.length - 1]

  if (httpMethods.includes(method)) {
    pathsCopy.pop()
  }

  const queryKey = getQueryKey(pathsCopy, anyArgs[0], type)
  return queryKey
}

/**
 * Inner proxy. __Does not recursively create more proxies!__
 *
 * Once the first property has been decided from the top-level proxy,
 * future property accesses will mutate a locally scoped array.
 */
export function createInnerContextProxy(
  domain?: string,
  config: EdenTreatyQueryConfig = {},
  queryClient = useQueryClient(),
  elysia?: Elysia<any, any, any, any, any, any>,
): any {
  const paths: any[] = []

  const innerProxy = new Proxy(() => {}, {
    get(_, path: string): any {
      if (path !== 'index') {
        paths.push(path)
      }
      return innerProxy
    },
    apply(_, __, anyArgs) {
      /**
       * @example 'fetch', 'invalidate'
       */
      const hook = paths[paths.length - 1]
      switch (hook) {
        case 'options': {
          const queryOptions = createTreatyQueryOptions(paths, anyArgs, domain, config, elysia)
          return queryOptions
        }

        case 'infiniteOptions': {
          const infiniteQueryOptions = createTreatyInfiniteQueryOptions(
            paths,
            anyArgs,
            domain,
            config,
            elysia,
          )
          return infiniteQueryOptions
        }

        case 'fetch': {
          const queryOptions = createTreatyQueryOptions(paths, anyArgs, domain, config, elysia)
          return queryClient.fetchQuery(queryOptions)
        }

        case 'prefetch': {
          const queryOptions = createTreatyQueryOptions(paths, anyArgs, domain, config, elysia)
          return queryClient.prefetchQuery(queryOptions)
        }

        case 'getData': {
          const queryOptions = createTreatyQueryOptions(paths, anyArgs, domain, config, elysia)
          return queryClient.getQueryData(queryOptions.queryKey)
        }

        case 'ensureData': {
          const queryOptions = createTreatyQueryOptions(paths, anyArgs, domain, config, elysia)
          return queryClient.ensureQueryData(queryOptions)
        }

        case 'setData': {
          const queryOptions = createTreatyQueryOptions(paths, anyArgs, domain, config, elysia)
          return queryClient.setQueryData(queryOptions.queryKey, anyArgs[1], anyArgs[2])
        }

        case 'fetchInfinite': {
          const infiniteQueryOptions = createTreatyInfiniteQueryOptions(
            paths,
            anyArgs,
            domain,
            config,
            elysia,
          )
          return queryClient.fetchInfiniteQuery(infiniteQueryOptions)
        }

        case 'prefetchInfinite': {
          const infiniteQueryOptions = createTreatyInfiniteQueryOptions(
            paths,
            anyArgs,
            domain,
            config,
            elysia,
          )
          return queryClient.prefetchInfiniteQuery(infiniteQueryOptions)
        }

        case 'getInfiniteData': {
          const infiniteQueryOptions = createTreatyInfiniteQueryOptions(
            paths,
            anyArgs,
            domain,
            config,
            elysia,
          )
          return queryClient.getQueryData(infiniteQueryOptions.queryKey)
        }

        case 'ensureInfiniteData': {
          const infiniteQueryOptions = createTreatyInfiniteQueryOptions(
            paths,
            anyArgs,
            domain,
            config,
            elysia,
          )
          return queryClient.ensureQueryData(infiniteQueryOptions)
        }

        case 'setInfiniteData': {
          const infiniteQueryOptions = createTreatyInfiniteQueryOptions(
            paths,
            anyArgs,
            domain,
            config,
            elysia,
          )
          return queryClient.setQueryData(infiniteQueryOptions.queryKey, anyArgs[0], anyArgs[1])
        }

        case 'invalidate': {
          const queryKey = createTreatyQueryKey(paths, anyArgs)
          return queryClient.invalidateQueries({ queryKey, ...anyArgs[0] }, anyArgs[1])
        }

        case 'refetch': {
          const queryKey = createTreatyQueryKey(paths, anyArgs)
          return queryClient.refetchQueries({ queryKey, ...anyArgs[0] }, anyArgs[1])
        }

        case 'cancel': {
          const queryKey = createTreatyQueryKey(paths, anyArgs)
          return queryClient.cancelQueries({ queryKey, ...anyArgs[0] }, anyArgs[1])
        }

        case 'reset': {
          const queryKey = createTreatyQueryKey(paths, anyArgs)
          return queryClient.resetQueries({ queryKey, ...anyArgs[0] }, anyArgs[1])
        }

        default:
          throw new TypeError(`context.${paths.join('.')}.${hook} is not a function`)
      }
    },
  })

  return innerProxy
}

/**
 * Top-level proxy that exposes utilities.
 */
export function createContext<TSchema extends Record<string, any>>(
  domain?: string,
  config: EdenTreatyQueryConfig = {},
  queryClient = useQueryClient(),
  elysia?: Elysia<any, any, any, any, any, any>,
): EdenTreatyQueryContext<TSchema> {
  const topLevelProperties = {
    queryClient,
  }

  const defaultHandler = (path: string | symbol) => {
    const innerProxy = createInnerContextProxy(domain, config, queryClient, elysia)
    return innerProxy[path]
  }

  const context: any = new Proxy(noop, {
    get: (_, path) => topLevelProperties[path as keyof {}] ?? defaultHandler(path),
  })

  return context
}
