import {
  EdenClient,
  type EdenTreatyClient,
  type EmptyToVoid,
  type ExtractEdenTreatyRouteParams,
  type ExtractEdenTreatyRouteParamsInput,
  getPathParam,
  type HttpMutationMethod,
  type HttpQueryMethod,
  type InferRouteBody,
  type InferRouteError,
  type InferRouteOptions,
  type InferRouteOutput,
  parsePathsAndMethod,
} from '@ap0nia/eden'
import type {
  CancelOptions,
  InfiniteData,
  InvalidateOptions,
  InvalidateQueryFilters,
  Query,
  QueryFilters,
  QueryKey,
  RefetchOptions,
  RefetchQueryFilters,
  ResetOptions,
  SetDataOptions,
  Updater,
  UseInfiniteQueryOptions,
  UseQueryOptions,
} from '@tanstack/react-query'
import type { AnyElysia, RouteSchema } from 'elysia'

import type { EdenQueryConfig } from '../../config'
import {
  contextProps,
  type EdenContextPropsBase,
  type EdenContextState,
  getQueryType,
} from '../../context'
import type { EdenFetchInfiniteQueryOptions } from '../../integration/hooks/fetch-infinite'
import type { EdenFetchQueryOptions } from '../../integration/hooks/fetch-query'
import type { EdenUseInfiniteQueryOptions } from '../../integration/hooks/use-infinite-query'
import type { EdenUseMutationOptions } from '../../integration/hooks/use-mutation'
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
import type { DeepPartial, Override, ProtectedIntersection } from '../../utils/types'

export type EdenTreatyReactQueryUtils<
  TElysia extends AnyElysia,
  TSSRContext,
> = ProtectedIntersection<
  DecoratedEdenTreatyReactQueryContextProps<TElysia, TSSRContext>,
  EdenTreatyReactQueryUtilsProxy<TElysia['_routes']>
>

export type DecoratedEdenTreatyReactQueryContextProps<
  TElysia extends AnyElysia,
  TSSRContext,
> = Omit<EdenContextPropsBase<TElysia, TSSRContext>, 'client'> & {
  client: EdenTreatyClient<TElysia>
}

export type EdenTreatyReactQueryContextProps<
  TElysia extends AnyElysia,
  TSSRContext,
> = EdenContextPropsBase<TElysia, TSSRContext> & {
  client: EdenClient<TElysia>
}

export type EdenTreatyReactQueryUtilsProxy<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
  TRouteParams = ExtractEdenTreatyRouteParams<TSchema>,
> = EdenTreatyQueryUtilsUniversalUtils & {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? EdenTreatyReactQueryUtilsMapping<TSchema[K], TPath, K>
    : EdenTreatyReactQueryUtilsProxy<TSchema[K], [...TPath, K]>
} & ({} extends TRouteParams
    ? {}
    : (
        params: ExtractEdenTreatyRouteParamsInput<TRouteParams>,
      ) => EdenTreatyReactQueryUtilsProxy<
        TSchema[Extract<keyof TRouteParams, keyof TSchema>],
        TPath
      >)

type EdenTreatyReactQueryUtilsMapping<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TMethod = '',
  TInput extends InferRouteOptions<TRoute> = InferRouteOptions<TRoute>,
> = TMethod extends HttpQueryMethod
  ? EdenTreatyQueryUtilsQueryUtils<TRoute, TPath> &
      (InfiniteCursorKey extends keyof (TInput['params'] & TInput['query'])
        ? EdenTreatyQueryUtilsInfiniteUtils<TRoute, TPath>
        : {})
  : TMethod extends HttpMutationMethod
    ? EdenQueryUtilsMutationUtils<TRoute, TPath>
    : `Unknown HTTP Method: ${TMethod & string}`

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
    options?: UseQueryOptions<TOutput, TError>,
  ) => UseQueryOptions<TOutput, TError>
}

export type EdenTreatyQueryUtilsInfiniteUtils<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute, ReservedInfiniteQueryKeys>['query'],
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
    options?: EdenUseInfiniteQueryOptions<TInput, TOutput, TError>,
  ) => UseInfiniteQueryOptions<TOutput, TError, TOutput, TKey>
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
      | EdenUseMutationOptions<TBody, TError, TOutput>
      | ((args: {
          canonicalMutationFn: NonNullable<
            EdenUseMutationOptions<TBody, TError, TOutput>['mutationFn']
          >
        }) => EdenUseMutationOptions<TBody, TError, TOutput>),
  ): void

  getMutationDefaults(): EdenUseMutationOptions<TBody, TError, TOutput> | undefined

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
): EdenTreatyReactQueryUtils<TRouter, TSSRContext> {
  // const clientProxy = createTRPCClientProxy(context.client)

  const proxy = createEdenTreatyQueryUtilsProxy(context, config)

  const utils = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      const contextName = path as (typeof contextProps)[number]

      // if (contextName === 'client') {
      //   return clientProxy
      // }

      if (contextProps.includes(contextName)) {
        return context[contextName]
      }

      return proxy[path as never]
    },
  })

  return utils as any
}

/**
 * @todo use config for something...
 */
export function createEdenTreatyQueryUtilsProxy<TRouter extends AnyElysia, TSSRContext>(
  context: EdenContextState<TRouter, TSSRContext>,
  config?: EdenQueryConfig<TRouter>,
  originalPaths: string[] = [],
  pathParams: Record<string, any>[] = [],
): EdenTreatyReactQueryUtils<TRouter, TSSRContext> {
  const proxy = new Proxy(() => {}, {
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
          return context.fetchQuery(queryKey, ...argsCopy)
        }

        case 'fetchInfinite': {
          return context.fetchInfiniteQuery(queryKey, argsCopy[0])
        }

        case 'prefetch': {
          return context.prefetchQuery(queryKey, ...argsCopy)
        }

        case 'prefetchInfinite': {
          return context.prefetchInfiniteQuery(queryKey, argsCopy[0])
        }

        case 'ensureData': {
          return context.ensureQueryData(queryKey, ...argsCopy)
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
          return context.setMutationDefaults(getMutationKey(paths), firstArg)
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

  return proxy as any
}
