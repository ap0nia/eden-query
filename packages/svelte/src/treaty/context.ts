import {
  type CancelOptions,
  type CreateInfiniteQueryOptions,
  type CreateQueryOptions,
  type FetchQueryOptions,
  type InfiniteData,
  type InvalidateOptions,
  type InvalidateQueryFilters,
  Query,
  QueryClient,
  type QueryFilters,
  type QueryKey,
  type RefetchOptions,
  type ResetOptions,
  type SetDataOptions,
  type Updater,
  useQueryClient,
} from '@tanstack/svelte-query'
import type { Elysia, RouteSchema } from 'elysia'

import type { EdenQueryConfig } from '../internal/config'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import {
  createTreatyInfiniteQueryOptions,
  createTreatyQueryKey,
  createTreatyQueryOptions,
  type EdenQueryKey,
  type InfiniteCursorKey,
  type ReservedInfiniteQueryKeys,
} from '../internal/query'
import type { AnyElysia, InstallMessage } from '../types'
import type { DeepPartial } from '../utils/deep-partial'
import { noop } from '../utils/noop'
import type { Override } from '../utils/override'

/**
 */
export type EdenTreatyQueryContext<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatyQueryContextMapping<TSchema>
  : InstallMessage

/**
 * Implementation.
 */
export type EdenTreatyQueryContextMapping<
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
    : InnerContextProxy<TSchema[K], [...TPath, K]>
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
  TInput extends InferRouteInput<TRoute> = InferRouteInput<TRoute>,
> = TreatyQueryContext<TRoute, TPath> &
  (InfiniteCursorKey extends keyof (TInput['params'] & TInput['query'])
    ? TreatyInfiniteQueryContext<TRoute, TPath>
    : {})

/**
 * Hooks for query procedures.
 */
type TreatyQueryContext<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteInput<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TKey extends QueryKey = EdenQueryKey<TPath, TInput>,
> = {
  fetch: (
    input: TInput,
    options?: FetchQueryOptions<TOutput, TError, TOutput, TKey> & EdenQueryConfig,
  ) => Promise<TOutput>

  prefetch: (
    input: TInput,
    options?: FetchQueryOptions<TOutput, TError, TOutput, TKey> & EdenQueryConfig,
  ) => Promise<void>

  ensureData: (
    input: TInput,
    options?: FetchQueryOptions<TOutput, TError, TOutput, TKey> & EdenQueryConfig,
  ) => Promise<TOutput>

  getData: (input: TInput) => TOutput | undefined

  setData: (
    input: TInput,
    updater: Updater<TOutput | undefined, TOutput | undefined>,
    options?: SetDataOptions & EdenQueryConfig,
  ) => void

  invalidate: (
    input?: DeepPartial<TInput>,
    filters?: Override<
      InvalidateQueryFilters,
      {
        predicate?: (query: Query<TOutput, TError, TOutput, TKey>) => boolean
      }
    >,
    options?: InvalidateOptions & EdenQueryConfig,
  ) => Promise<void>

  refetch: (
    input?: TInput,
    filters?: QueryFilters,
    options?: RefetchOptions & EdenQueryConfig,
  ) => Promise<void>

  cancel: (
    input?: TInput,
    filters?: QueryFilters,
    options?: CancelOptions & EdenQueryConfig,
  ) => Promise<void>

  reset: (
    input?: TInput,
    filters?: QueryFilters,
    options?: ResetOptions & EdenQueryConfig,
  ) => Promise<void>

  options: (
    input: TInput,
    options?: CreateQueryOptions<TOutput, TError> & EdenQueryConfig,
  ) => CreateQueryOptions<TOutput, TError>
}

/**
 * Hooks for infinite query procedures.
 */
type TreatyInfiniteQueryContext<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteInput<TRoute, any, ReservedInfiniteQueryKeys>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TKey extends QueryKey = EdenQueryKey<TPath>,
> = {
  fetchInfinite: (
    input: TInput,
    options?: FetchQueryOptions<TOutput, TError, TOutput, TKey> & EdenQueryConfig,
  ) => Promise<InfiniteData<TOutput>>

  prefetchInfinite: (
    input: TInput,
    options?: FetchQueryOptions<TOutput, TError, TOutput, TKey> & EdenQueryConfig,
  ) => Promise<void>

  getInfiniteData: (input: TInput) => InfiniteData<TOutput> | undefined

  setInfiniteData: (
    input: TInput,
    updater: Updater<InfiniteData<TOutput> | undefined, InfiniteData<TOutput> | undefined>,
    options?: SetDataOptions & EdenQueryConfig,
  ) => void

  infiniteOptions: (
    input: TInput,
    options?: CreateInfiniteQueryOptions<TOutput, TError, TOutput, TKey> & EdenQueryConfig,
  ) => CreateInfiniteQueryOptions<TOutput, TError, TOutput, TKey>
}

/**
 * Inner proxy. __Does not recursively create more proxies!__
 *
 * Once the first property has been decided from the top-level proxy,
 * future property accesses will mutate a locally scoped array.
 */
export function createInnerContextProxy(
  domain?: string,
  config: EdenQueryConfig = {},
  queryClient = useQueryClient(),
  elysia?: Elysia<any, any, any, any, any, any>,
): any {
  const paths: any[] = []

  const innerProxy = new Proxy(noop, {
    get: (_, path: string): any => {
      if (path !== 'index') {
        paths.push(path)
      }
      return innerProxy
    },
    apply: (_, __, anyArgs) => {
      /**
       * @example 'fetch', 'invalidate'
       */
      const hook = paths.pop()

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
export function createContext<T extends AnyElysia>(
  domain?: string,
  config: EdenQueryConfig = {},
  elysia?: Elysia<any, any, any, any, any, any>,
): EdenTreatyQueryContext<T> {
  const queryClient = config.queryClient ?? new QueryClient()

  const topLevelProperties = {
    queryClient,
  }

  const defaultHandler = (path: string | symbol) => {
    const innerProxy = createInnerContextProxy(domain, config, queryClient, elysia)
    return innerProxy[path]
  }

  const context: any = new Proxy(noop, {
    get: (_, path) => {
      return topLevelProperties[path as keyof {}] ?? defaultHandler(path)
    },
  })

  return context
}
