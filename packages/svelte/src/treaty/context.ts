import {
  type CancelOptions,
  type CreateInfiniteQueryOptions,
  type CreateQueryOptions,
  dehydrate,
  type DehydratedState,
  type InfiniteData,
  type InvalidateOptions,
  type InvalidateQueryFilters,
  Query,
  QueryClient,
  type QueryFilters,
  type QueryKey,
  type RefetchOptions,
  type RefetchQueryFilters,
  type ResetOptions,
  type SetDataOptions,
  type Updater,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'

import type { EdenClient } from '../internal/client'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import {
  createTreatyInfiniteQueryOptions,
  createTreatyQueryKey,
  createTreatyQueryOptions,
  type EdenCreateInfiniteQueryOptions,
  type EdenQueryKey,
  type EdenQueryRequestOptions,
  type ExtractCursorType,
  type InfiniteCursorKey,
  mergeDyhdrated,
  type ReservedInfiniteQueryKeys,
} from '../internal/query'
import type { AnyElysia, InstallMessage } from '../types'
import type { DeepPartial } from '../utils/deep-partial'
import { noop } from '../utils/noop'
import type { Override } from '../utils/override'
import type { EdenFetchInfiniteQueryOptions, EdenFetchQueryOptions } from './base'

/**
 */
export type EdenTreatyQueryContext<
  T extends AnyElysia,
  TConfig extends EdenQueryRequestOptions<T> = EdenQueryRequestOptions<T>,
> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? RootContext<TConfig> & EdenTreatyQueryContextMapping<TSchema>
  : InstallMessage

/**
 * Implementation.
 */
export type EdenTreatyQueryContextMapping<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
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
 * Type-safe access to dehydrated state and other root properties on the context.
 */
type RootContext<TConfig extends EdenQueryRequestOptions = EdenQueryRequestOptions> =
  SharedContext & {
    queryClient: QueryClient
  } & (undefined extends TConfig['dehydrated'] ? {} : { dehydrated: DehydratedState })

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
  fetch: (input: TInput, options?: EdenFetchQueryOptions<TOutput, TError>) => Promise<TOutput>

  prefetch: (input: TInput, options?: EdenFetchQueryOptions<TOutput, TError>) => Promise<void>

  ensureData: (input: TInput, options?: EdenFetchQueryOptions<TOutput, TError>) => Promise<TOutput>

  invalidate: (
    input?: DeepPartial<TInput>,
    filters?: Override<
      InvalidateQueryFilters,
      {
        predicate?: (
          query: Query<TInput, TError, TInput, TKey /** TODO: TKey omit infinite input */>,
        ) => boolean
      }
    >,
    options?: InvalidateOptions,
  ) => Promise<void>

  refetch: (
    input?: TInput,
    filters?: RefetchQueryFilters,
    options?: RefetchOptions,
  ) => Promise<void>

  cancel: (input?: TInput, filters?: QueryFilters, options?: CancelOptions) => Promise<void>

  setData: (
    input: TInput,
    updater: Updater<TOutput | undefined, TOutput | undefined>,
    options?: SetDataOptions,
  ) => void

  reset: (input?: TInput, options?: ResetOptions) => Promise<void>

  getData: (input: TInput) => TOutput | undefined

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
  TInput = InferRouteInput<TRoute, any, ReservedInfiniteQueryKeys>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TKey extends QueryKey = EdenQueryKey<TPath>,
> = {
  fetchInfinite: (
    input: TInput,
    options?: EdenFetchInfiniteQueryOptions<TInput, TOutput, TError>,
  ) => Promise<InfiniteData<TOutput, NonNullable<ExtractCursorType<TInput>>>>

  prefetchInfinite: (
    input: TInput,
    options?: EdenFetchQueryOptions<TOutput, TError>,
  ) => Promise<void>

  getInfiniteData: (
    input: TInput,
  ) => InfiniteData<TOutput, NonNullable<ExtractCursorType<TInput>>> | undefined

  setInfiniteData: (
    input: TInput,
    updater: Updater<
      InfiniteData<TOutput, NonNullable<ExtractCursorType<TInput>>> | undefined,
      InfiniteData<TOutput, NonNullable<ExtractCursorType<TInput>>> | undefined
    >,
    options?: SetDataOptions,
  ) => void

  infiniteOptions: (
    input: TInput,
    options?: EdenCreateInfiniteQueryOptions<TInput, TOutput, TError>,
  ) => CreateInfiniteQueryOptions<TOutput, TError, TOutput, TKey>
}

/**
 * Inner proxy. __Does not recursively create more proxies!__
 *
 * Once the first property has been decided from the top-level proxy,
 * future property accesses will mutate a locally scoped array.
 */
export function createInnerContextProxy(
  client: EdenClient,
  config?: EdenQueryRequestOptions,
  originalPaths: any[] = [],
): any {
  const queryClient = config?.queryClient ?? new QueryClient()

  const resolvedConfig = config?.queryClient == null ? { ...config, queryClient } : config

  const dehydrated =
    config?.dehydrated != null && typeof config.dehydrated !== 'boolean'
      ? config.dehydrated
      : undefined

  const mergeSSRCache = <T>(result: T) => {
    if (dehydrated != null) {
      mergeDyhdrated(queryClient, dehydrated)
    }
    return result
  }

  const paths = [...originalPaths]

  const innerProxy = new Proxy(noop, {
    get: (_target, path): any => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createInnerContextProxy(client, resolvedConfig, nextPaths)
    },
    apply: (_target, _thisArg, args) => {
      const hook = paths.pop()

      switch (hook) {
        case 'options': {
          const queryOptions = createTreatyQueryOptions(client, resolvedConfig, paths, args)
          return queryOptions
        }

        case 'infiniteOptions': {
          const queryOptions = createTreatyInfiniteQueryOptions(client, resolvedConfig, paths, args)
          return queryOptions
        }

        case 'fetch': {
          const queryOptions = createTreatyQueryOptions(client, resolvedConfig, paths, args)
          return queryClient.fetchQuery(queryOptions).then(mergeSSRCache)
        }

        case 'prefetch': {
          const queryOptions = createTreatyQueryOptions(client, resolvedConfig, paths, args)
          return queryClient.prefetchQuery(queryOptions).then(mergeSSRCache)
        }

        case 'getData': {
          const queryOptions = createTreatyQueryOptions(client, resolvedConfig, paths, args)
          return queryClient.getQueryData(queryOptions.queryKey)
        }

        case 'ensureData': {
          const queryOptions = createTreatyQueryOptions(client, resolvedConfig, paths, args)
          return queryClient.ensureQueryData(queryOptions).then(mergeSSRCache)
        }

        case 'setData': {
          const queryOptions = createTreatyQueryOptions(client, resolvedConfig, paths, args)
          return queryClient.setQueryData(queryOptions.queryKey, args[1], args[2])
        }

        case 'fetchInfinite': {
          const queryOptions = createTreatyInfiniteQueryOptions(client, resolvedConfig, paths, args)
          return queryClient.fetchInfiniteQuery(queryOptions).then(mergeSSRCache)
        }

        case 'prefetchInfinite': {
          const queryOptions = createTreatyInfiniteQueryOptions(client, resolvedConfig, paths, args)
          return queryClient.prefetchInfiniteQuery(queryOptions).then(mergeSSRCache)
        }

        case 'getInfiniteData': {
          const queryOptions = createTreatyInfiniteQueryOptions(client, resolvedConfig, paths, args)
          return queryClient.getQueryData(queryOptions.queryKey)
        }

        case 'ensureInfiniteData': {
          const queryOptions = createTreatyInfiniteQueryOptions(client, resolvedConfig, paths, args)
          return queryClient.ensureQueryData(queryOptions).then(mergeSSRCache)
        }

        case 'setInfiniteData': {
          const queryOptions = createTreatyInfiniteQueryOptions(
            client,
            resolvedConfig,
            originalPaths,
            args,
          )
          return queryClient.setQueryData(queryOptions.queryKey, args[0], args[1])
        }

        case 'invalidate': {
          const queryKey = createTreatyQueryKey(paths, args)
          return queryClient.invalidateQueries({ queryKey, ...args[0] }, args[1])
        }

        case 'refetch': {
          const queryKey = createTreatyQueryKey(paths, args)
          return queryClient.refetchQueries({ queryKey, ...args[0] }, args[1])
        }

        case 'cancel': {
          const queryKey = createTreatyQueryKey(paths, args)
          return queryClient.cancelQueries({ queryKey, ...args[0] }, args[1])
        }

        case 'reset': {
          const queryKey = createTreatyQueryKey(paths, args)
          return queryClient.resetQueries({ queryKey, ...args[0] }, args[1])
        }

        default: {
          throw new TypeError(`context.${paths.join('.')}.${hook} is not a function`)
        }
      }
    },
  })

  return innerProxy
}

/**
 * Top-level proxy that exposes utilities.
 */
export function createContext<
  T extends AnyElysia,
  TConfig extends EdenQueryRequestOptions<T> = EdenQueryRequestOptions<T>,
>(client: EdenClient, config?: TConfig): EdenTreatyQueryContext<T, TConfig> {
  const queryClient = config?.queryClient ?? new QueryClient()

  const dehydrated = config?.dehydrated === true ? dehydrate(queryClient) : config?.dehydrated

  const topLevelProperties = {
    queryClient,
    dehydrated,
  }

  const resolvedConfig = config?.dehydrated != null ? { ...config, dehydrated } : config

  const defaultHandler = (path: string | symbol) => {
    const innerProxy = createInnerContextProxy(client, resolvedConfig)
    return innerProxy[path]
  }

  const context: any = new Proxy(noop, {
    get: (_, path) => {
      return topLevelProperties[path as keyof {}] ?? defaultHandler(path)
    },
  })

  return context
}
