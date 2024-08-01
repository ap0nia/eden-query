import {
  EdenClient,
  type EdenRequestOptions,
  type InferRouteError,
  type InferRouteOptions,
  type InferRouteOutput,
} from '@elysiajs/eden'
import {
  type CancelOptions,
  type CreateInfiniteQueryOptions,
  type CreateQueryOptions,
  dehydrate,
  type DehydratedState,
  type FetchInfiniteQueryOptions,
  type FetchQueryOptions,
  type InfiniteData,
  type InvalidateOptions,
  type InvalidateQueryFilters,
  type Query,
  QueryClient,
  type QueryFilters,
  type QueryKey,
  type RefetchOptions,
  type RefetchQueryFilters,
  type ResetOptions,
  type SetDataOptions,
  type Updater,
} from '@tanstack/svelte-query'
import type { AnyElysia, RouteSchema } from 'elysia'

import {
  createEdenInfiniteQueryOptions,
  type EdenCreateInfiniteQueryOptions,
  type ExtractCursorType,
  type InfiniteCursorKey,
  type ReservedInfiniteQueryKeys,
} from '../create-infinite-query'
import { createEdenQueryOptions } from '../create-query'
import { mergeDehydrated } from '../dehydrate'
import { createEdenQueryKey, type EdenQueryKey } from '../query-key'
import type { EdenQueryRequestOptions } from '../request'
import type { DeepPartial, DistributiveOmit, Override } from '../utils/types'

export type EdenFetchQueryOptions<TOutput, TError> = DistributiveOmit<
  FetchQueryOptions<TOutput, TError>,
  'queryKey'
> &
  EdenRequestOptions

export type EdenFetchInfiniteQueryOptions<TInput, TOutput, TError> = DistributiveOmit<
  FetchInfiniteQueryOptions<TOutput, TError, TOutput, EdenQueryKey, ExtractCursorType<TInput>>,
  'queryKey' | 'initialPageParam'
> &
  EdenRequestOptions & {
    initialCursor?: ExtractCursorType<TInput>
  }

/**
 */
export type EdenTreatyQueryContext<
  T extends AnyElysia,
  TConfig extends EdenQueryRequestOptions<T> = EdenQueryRequestOptions<T>,
> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? RootContext<TConfig> & EdenTreatyQueryContextImplementation<TSchema>
  : 'Please install Elysia before using Eden'

/**
 * Implementation.
 */
export type EdenTreatyQueryContextImplementation<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? EdenTreatyContextHooks<TSchema[K], TPath, K>
    : EdenTreatyQueryContextInner<TSchema[K], [...TPath, K]>
}

/**
 * Almost the same as {@link EdenTreatyQueryContext}, but extends {@link SharedContext}
 * instead of {@link RootContext}.
 */
export type EdenTreatyQueryContextInner<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = SharedContext & {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? EdenTreatyContextHooks<TSchema[K], [...TPath, K]>
    : EdenTreatyQueryContextInner<TSchema[K], [...TPath, K]>
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
type EdenTreatyContextHooks<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  _TMethod = '',
  TInput extends InferRouteOptions<TRoute> = InferRouteOptions<TRoute>,
> = TreatyQueryContext<TRoute, TPath> &
  (InfiniteCursorKey extends keyof (TInput['params'] & TInput['query'])
    ? EdenTreatyInfiniteQueryContext<TRoute, TPath>
    : {})

/**
 * Hooks for query procedures.
 */
type TreatyQueryContext<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
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
 * Available hooks assuming that the route supports infinite queries.
 */
type EdenTreatyInfiniteQueryContext<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute, ReservedInfiniteQueryKeys>,
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
 * Inner proxy.
 */
export function createInnerContextProxy(
  client: EdenClient,
  defaultConfig?: EdenQueryRequestOptions,
  originalPaths: any[] = [],
): any {
  const queryClient = defaultConfig?.queryClient ?? new QueryClient()

  const config =
    defaultConfig?.queryClient == null ? { ...defaultConfig, queryClient } : defaultConfig

  const dehydrated =
    defaultConfig?.dehydrated != null && typeof defaultConfig.dehydrated !== 'boolean'
      ? defaultConfig.dehydrated
      : undefined

  const mergeSSRCache = <T>(result: T) => {
    if (dehydrated != null) {
      mergeDehydrated(queryClient, dehydrated)
    }
    return result
  }

  const paths = [...originalPaths]

  const innerProxy = new Proxy(() => {}, {
    get: (_target, path, _receiver): any => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createInnerContextProxy(client, config, nextPaths)
    },
    apply: (_target, _thisArg, args) => {
      const hook = paths.pop()

      switch (hook) {
        case 'options': {
          const queryOptions = createEdenQueryOptions(client, config, paths, args)
          return queryOptions
        }

        case 'infiniteOptions': {
          const queryOptions = createEdenInfiniteQueryOptions(client, config, paths, args)
          return queryOptions
        }

        case 'fetch': {
          const queryOptions = createEdenQueryOptions(client, config, paths, args)
          return queryClient.fetchQuery(queryOptions).then(mergeSSRCache)
        }

        case 'prefetch': {
          const queryOptions = createEdenQueryOptions(client, config, paths, args)
          return queryClient.prefetchQuery(queryOptions).then(mergeSSRCache)
        }

        case 'getData': {
          const queryOptions = createEdenQueryOptions(client, config, paths, args)
          return queryClient.getQueryData(queryOptions.queryKey)
        }

        case 'ensureData': {
          const queryOptions = createEdenQueryOptions(client, config, paths, args)
          return queryClient.ensureQueryData(queryOptions).then(mergeSSRCache)
        }

        case 'setData': {
          const queryOptions = createEdenQueryOptions(client, config, paths, args)
          return queryClient.setQueryData(queryOptions.queryKey, args[1], args[2])
        }

        case 'fetchInfinite': {
          const queryOptions = createEdenInfiniteQueryOptions(client, config, paths, args)
          return queryClient.fetchInfiniteQuery(queryOptions).then(mergeSSRCache)
        }

        case 'prefetchInfinite': {
          const queryOptions = createEdenInfiniteQueryOptions(client, config, paths, args)
          return queryClient.prefetchInfiniteQuery(queryOptions).then(mergeSSRCache)
        }

        case 'getInfiniteData': {
          const queryOptions = createEdenInfiniteQueryOptions(client, config, paths, args)
          return queryClient.getQueryData(queryOptions.queryKey)
        }

        case 'ensureInfiniteData': {
          const queryOptions = createEdenInfiniteQueryOptions(client, config, paths, args)
          return queryClient.ensureQueryData(queryOptions).then(mergeSSRCache)
        }

        case 'setInfiniteData': {
          const queryOptions = createEdenInfiniteQueryOptions(client, config, originalPaths, args)
          return queryClient.setQueryData(queryOptions.queryKey, args[0], args[1])
        }

        case 'invalidate': {
          const queryKey = createEdenQueryKey(paths, args)
          return queryClient.invalidateQueries({ queryKey, ...args[0] }, args[1])
        }

        case 'refetch': {
          const queryKey = createEdenQueryKey(paths, args)
          return queryClient.refetchQueries({ queryKey, ...args[0] }, args[1])
        }

        case 'cancel': {
          const queryKey = createEdenQueryKey(paths, args)
          return queryClient.cancelQueries({ queryKey, ...args[0] }, args[1])
        }

        case 'reset': {
          const queryKey = createEdenQueryKey(paths, args)
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

  const context: any = new Proxy(() => {}, {
    get: (_, path) => {
      return topLevelProperties[path as keyof {}] ?? defaultHandler(path)
    },
  })

  return context
}
