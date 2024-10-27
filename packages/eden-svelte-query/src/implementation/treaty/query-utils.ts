import {
  createEdenTreaty,
  EdenClient,
  type EdenTreatyClient,
  type EmptyToVoid,
  type ExtractEdenTreatyRouteParams,
  type ExtractEdenTreatyRouteParamsInput,
  type HttpMutationMethod,
  type HttpQueryMethod,
  type InferRouteBody,
  type InferRouteError,
  type InferRouteOptions,
  type InferRouteOutput,
  parsePathsAndMethod,
} from '@ap0nia/eden'
import {
  type CancelOptions,
  type CreateInfiniteQueryOptions,
  type CreateQueryOptions,
  dehydrate,
  type DehydratedState,
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

import type { EdenQueryConfig } from '../../config'
import {
  contextProps,
  type EdenContextPropsBase,
  type EdenContextState,
  getQueryType,
} from '../../context'
import type { EdenCreateInfiniteQueryOptions } from '../../integration/hooks/create-infinite-query'
import type { EdenCreateMutationOptions } from '../../integration/hooks/create-mutation'
import type { EdenFetchInfiniteQueryOptions } from '../../integration/hooks/fetch-infinite'
import type { EdenFetchQueryOptions } from '../../integration/hooks/fetch-query'
import type {
  ExtractCursorType,
  InfiniteCursorKey,
  ReservedInfiniteQueryKeys,
} from '../../integration/internal/infinite-query'
import {
  type EdenQueryKey,
  getMutationKey,
  getQueryKey,
} from '../../integration/internal/query-key'
import { getPathParam } from '../../utils/path-param'
import type { DeepPartial, Override, ProtectedIntersection } from '../../utils/types'

export type EdenTreatySvelteQueryUtils<
  TElysia extends AnyElysia,
  TSSRContext,
> = ProtectedIntersection<
  DecoratedEdenTreatySvelteQueryContextProps<TElysia, TSSRContext>,
  EdenTreatySvelteQueryUtilsProxy<TElysia['_routes']>
>

export type DecoratedEdenTreatySvelteQueryContextProps<
  TElysia extends AnyElysia,
  TSSRContext,
> = Omit<EdenContextPropsBase<TElysia, TSSRContext>, 'client'> & {
  client: EdenTreatyClient<TElysia>
}

export type EdenTreatySvelteQueryContextProps<
  TElysia extends AnyElysia,
  TSSRContext,
> = EdenContextPropsBase<TElysia, TSSRContext> & {
  client: EdenClient<TElysia>
}

export type EdenTreatySvelteQueryUtilsProxy<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
  TRouteParams = ExtractEdenTreatyRouteParams<TSchema>,
> = EdenTreatyQueryUtilsUniversalUtils & {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? EdenTreatyQueryUtilsMapping<TSchema[K], TPath, K>
    : EdenTreatySvelteQueryUtilsProxy<TSchema[K], [...TPath, K]>
} & ({} extends TRouteParams
    ? {}
    : (
        params: ExtractEdenTreatyRouteParamsInput<TRouteParams>,
      ) => EdenTreatySvelteQueryUtilsProxy<
        TSchema[Extract<keyof TRouteParams, keyof TSchema>],
        TPath
      >)

type EdenTreatyQueryUtilsMapping<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TMethod = '',
  TInput = InferRouteOptions<TRoute>['query'],
> = TMethod extends HttpQueryMethod
  ? EdenTreatyQueryUtilsQueryUtils<TRoute, TPath> &
      (InfiniteCursorKey extends keyof TInput
        ? EdenTreatyQueryUtilsInfiniteUtils<TRoute, TPath>
        : {})
  : TMethod extends HttpMutationMethod
    ? EdenQueryUtilsMutationUtils<TRoute, TPath>
    : never

export type EdenTreatyQueryUtilsQueryUtils<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>['query'],
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TKey extends QueryKey = EdenQueryKey<TPath, TInput>,
> = {
  fetch: (
    input: EmptyToVoid<TInput>,
    options?: EdenFetchQueryOptions<TOutput, TError>,
  ) => Promise<TOutput>

  prefetch: (
    input: EmptyToVoid<TInput>,
    options?: EdenFetchQueryOptions<TOutput, TError>,
  ) => Promise<void>

  ensureData: (
    input: EmptyToVoid<TInput>,
    options?: EdenFetchQueryOptions<TOutput, TError>,
  ) => Promise<TOutput>

  invalidate: (
    input?: DeepPartial<TInput>,
    filters?: Override<
      InvalidateQueryFilters,
      {
        predicate?: (query: Query<TInput, TError, TInput, TKey>) => boolean
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

  reset: (input?: TInput, options?: ResetOptions) => Promise<void>

  setData: (
    input: TInput,
    updater: Updater<TOutput | undefined, TOutput | undefined>,
    options?: SetDataOptions,
  ) => void

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientsetquerydata
   */
  setQueriesData(
    input: TInput,
    filters: QueryFilters,
    updater: Updater<TOutput | undefined, TOutput | undefined>,
    options?: SetDataOptions,
  ): [QueryKey, TOutput]

  getData: (input: EmptyToVoid<TInput>) => TOutput | undefined

  options: (
    input: EmptyToVoid<TInput>,
    options?: CreateQueryOptions<TOutput, TError>,
  ) => CreateQueryOptions<TOutput, TError>
}

export type EdenTreatyQueryUtilsInfiniteUtils<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute, ReservedInfiniteQueryKeys>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TKey extends QueryKey = EdenQueryKey<TPath, TInput>,
> = {
  fetchInfinite: (
    input: EmptyToVoid<TInput>,
    options?: EdenFetchInfiniteQueryOptions<TInput, TOutput, TError>,
  ) => Promise<InfiniteData<TOutput, NonNullable<ExtractCursorType<TInput>>>>

  prefetchInfinite: (
    input: EmptyToVoid<TInput>,
    options?: EdenFetchQueryOptions<TOutput, TError>,
  ) => Promise<void>

  getInfiniteData: (
    input: EmptyToVoid<TInput>,
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
    input: EmptyToVoid<TInput>,
    options?: EdenCreateInfiniteQueryOptions<TInput, TOutput, TError>,
  ) => CreateInfiniteQueryOptions<TOutput, TError, TOutput, TKey>
}

export type EdenQueryUtilsMutationUtils<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TBody = InferRouteBody<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  _TKey extends QueryKey = EdenQueryKey<TPath, TBody>,
> = {
  setMutationDefaults(
    options:
      | EdenCreateMutationOptions<TBody, TError, TOutput>
      | ((args: {
          canonicalMutationFn: NonNullable<
            EdenCreateMutationOptions<TBody, TError, TOutput>['mutationFn']
          >
        }) => EdenCreateMutationOptions<TBody, TError, TOutput>),
  ): void

  getMutationDefaults(): EdenCreateMutationOptions<TBody, TError, TOutput> | undefined

  isMutating(): number
}

/**
 * Utility hooks available at all levels of the utilities proxy.
 */
export type EdenTreatyQueryUtilsUniversalUtils = {
  /**
   * Invalidate the full router
   * @link https://trpc.io/docs/v10/useContext#query-invalidation
   * @link https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation
   */
  invalidate(
    input?: undefined,
    filters?: InvalidateQueryFilters,
    options?: InvalidateOptions,
  ): Promise<void>
}

export function createEdenTreatyQueryUtils<TRouter extends AnyElysia, TSSRContext>(
  context: EdenContextState<TRouter, TSSRContext>,
  config?: EdenQueryConfig<TRouter>,
): EdenTreatySvelteQueryUtils<TRouter, TSSRContext> {
  const clientProxy = createEdenTreaty(context.client)

  const queryClient = context.queryClient ?? new QueryClient()

  const dehydrated = config?.dehydrated === true ? dehydrate(queryClient) : config?.dehydrated

  const topLevelProperties = {
    queryClient,
    dehydrated,
  }

  const proxy = createEdenTreatyQueryUtilsProxy(context, config)

  const utils = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      const contextName = path as (typeof contextProps)[number]

      if (Object.prototype.hasOwnProperty.call(topLevelProperties, path)) {
        return topLevelProperties[path as never]
      }

      switch (contextName) {
        case 'client': {
          return clientProxy
        }

        default: {
          if (contextProps.includes(contextName)) {
            return context[contextName]
          }
          return proxy[path as never]
        }
      }
    },
  })

  return utils as any
}

export function mergeDehydrated(
  source: DehydratedState | QueryClient,
  destination: DehydratedState,
): DehydratedState {
  const dehydratedSource = 'mount' in source ? dehydrate(source) : source

  destination.queries.push(...dehydratedSource.queries)
  destination.mutations.push(...dehydratedSource.mutations)

  return destination
}

export function createEdenTreatyQueryUtilsProxy<TRouter extends AnyElysia, TSSRContext>(
  context: EdenContextState<TRouter, TSSRContext>,
  config?: EdenQueryConfig<TRouter>,
  originalPaths: string[] = [],
  pathParams: Record<string, any>[] = [],
): EdenTreatySvelteQueryUtils<TRouter, TSSRContext> {
  const queryClient = context.queryClient ?? new QueryClient()

  const dehydrated =
    config?.dehydrated != null && typeof config.dehydrated !== 'boolean'
      ? config.dehydrated
      : undefined

  const mergeSSRCache = <T>(result: T) => {
    if (dehydrated != null) {
      mergeDehydrated(queryClient, dehydrated)
    }
    return result
  }

  const edenTreatyQueryUtilsProxy = new Proxy(() => {}, {
    get: (_target, path: string, _receiver) => {
      const nextPaths = path === 'index' ? [...originalPaths] : [...originalPaths, path]
      return createEdenTreatyQueryUtilsProxy(context, config, nextPaths, pathParams)
    },
    apply: (_target, _thisArg, args) => {
      const pathParam = getPathParam(args)

      if (pathParam?.key != null) {
        const allPathParams = [...pathParams, pathParam.param]
        const pathsWithParams = [...originalPaths, `:${pathParam.key}`]
        return createEdenTreatyQueryUtilsProxy(context, config, pathsWithParams, allPathParams)
      }

      const argsCopy = [...args]

      /**
       * @example ['api', 'hello', 'get', 'invalidate']
       */
      const pathsCopy = [...originalPaths]

      /**
       * @example
       *
       * Original array: ['api', 'hello', 'get', 'invalidate']
       *
       * Hook: 'invalidate'
       *
       * Resulting array: ['api', 'hello', 'get']
       */
      const hook = pathsCopy.pop() ?? ''

      /**
       * This will trim the method from the {@link pathsCopy} if it still exists.
       *
       * @example
       *
       * Previous array: ['api', 'hello', 'get']
       *
       * Method: 'get'
       *
       * Resulting array: ['api', 'hello']
       */
      const { paths } = parsePathsAndMethod(pathsCopy)

      const queryType = getQueryType(hook)

      // The rest of the args are passed directly to the function.
      const firstArg = argsCopy.shift()

      let input: any = undefined

      if (firstArg != null) {
        input ??= {}
        input.query = firstArg
      }

      if (pathParams.length) {
        input ??= {}
        input.params = {}

        for (const param of pathParams) {
          for (const key in param) {
            input.params[key] = param[key]
          }
        }
      }

      const queryKey = getQueryKey(paths, input, queryType)

      switch (hook) {
        case 'fetch': {
          return context.fetchQuery(queryKey, ...argsCopy).then(mergeSSRCache)
        }

        case 'fetchInfinite': {
          return context.fetchInfiniteQuery(queryKey, argsCopy[0]).then(mergeSSRCache)
        }

        case 'prefetch': {
          return context.prefetchQuery(queryKey, ...argsCopy).then(mergeSSRCache)
        }

        case 'prefetchInfinite': {
          return context.prefetchInfiniteQuery(queryKey, argsCopy[0]).then(mergeSSRCache)
        }

        case 'ensureData': {
          return context.ensureQueryData(queryKey, ...argsCopy).then(mergeSSRCache)
        }

        case 'invalidate': {
          return context.invalidateQueries(queryKey, ...argsCopy)
        }

        case 'reset': {
          return context.resetQueries(queryKey, ...argsCopy)
        }

        case 'refetch': {
          return context.refetchQueries(queryKey, ...argsCopy)
        }

        case 'cancel': {
          return context.cancelQuery(queryKey, ...argsCopy)
        }

        case 'setData': {
          return context.setQueryData(queryKey, argsCopy[0], argsCopy[1])
        }

        case 'setQueriesData': {
          return context.setQueriesData(queryKey, argsCopy[0], argsCopy[1], argsCopy[2])
        }

        case 'setInfiniteData': {
          return context.setInfiniteQueryData(queryKey, argsCopy[0], argsCopy[1])
        }

        case 'getData': {
          return context.getQueryData(queryKey)
        }

        case 'getInfiniteData': {
          return context.getInfiniteQueryData(queryKey)
        }

        case 'setMutationDefaults': {
          return context.setMutationDefaults(getMutationKey(paths), input)
        }

        case 'getMutationDefaults': {
          return context.getMutationDefaults(getMutationKey(paths))
        }

        case 'isMutating': {
          return context.isMutating({ mutationKey: getMutationKey(paths) })
        }

        default: {
          throw new TypeError(`eden.${originalPaths.join('.')} is not a function`)
        }
      }
    },
  })

  return edenTreatyQueryUtilsProxy as any
}
