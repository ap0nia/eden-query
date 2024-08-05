import {
  EdenClient,
  type EdenClientError as EdenClientError,
  type EdenClientOptions,
  type EdenRequestParams,
  type InferRouteBody,
  type InferRouteError,
  type InferRouteOptions,
  type InferRouteOutput,
} from '@elysiajs/eden'
import type { HttpMutationMethod, HttpQueryMethod } from '@elysiajs/eden/http.ts'
import {
  type CancelOptions,
  type FetchQueryOptions,
  type InfiniteData,
  type InvalidateOptions,
  type InvalidateQueryFilters,
  type MutationOptions,
  Query,
  QueryClient,
  type QueryFilters,
  type QueryKey,
  type RefetchOptions,
  type RefetchQueryFilters,
  type ResetOptions,
  type SetDataOptions,
  type Updater,
  type UseInfiniteQueryOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import type { AnyElysia, RouteSchema } from 'elysia'
import * as React from 'react'

import type { EdenFetchInfiniteQueryOptions } from './integration/hooks/fetch-infinite'
import type { EdenFetchQueryOptions } from './integration/hooks/fetch-query'
import type { EdenUseInfiniteQueryOptions } from './integration/hooks/use-infinite-query'
import type { EdenUseMutationOptions } from './integration/hooks/use-mutation'
import { parsePathsAndMethod } from './integration/internal/helpers'
import type { ExtractCursorType, InfiniteCursorKey } from './integration/internal/infinite-query'
import type { EdenMutationKey, EdenQueryKey, EdenQueryType } from './integration/internal/query-key'
import type { DeepPartial, Override, ProtectedIntersection } from './utils/types'

export type CreateEdenClient<T extends AnyElysia = AnyElysia> = (
  options: EdenClientOptions<T>,
) => EdenClient<T>

export interface EdenCreateReactQueryUtilsOptions<T extends AnyElysia, _TSSRContext = any> {
  /**
   * The `TRPCClient`
   */
  client: EdenClient<T>

  /**
   * The `QueryClient` from `react-query`
   */
  queryClient: QueryClient
}

/**
 * @internal
 */
export type EdenQueryUtils<TRouter extends AnyElysia> = {
  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientfetchquery
   */
  fetchQuery: (
    queryKey: EdenQueryKey,
    opts?: EdenFetchQueryOptions<unknown, EdenClientError<TRouter>>,
  ) => Promise<unknown>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientfetchinfinitequery
   */
  fetchInfiniteQuery: (
    queryKey: EdenQueryKey,
    opts?: EdenFetchInfiniteQueryOptions<unknown, unknown, EdenClientError<TRouter>>,
  ) => Promise<InfiniteData<unknown, unknown>>

  /**
   * @link https://tanstack.com/query/v5/docs/framework/react/guides/prefetching
   */
  prefetchQuery: (
    queryKey: EdenQueryKey,
    opts?: EdenFetchQueryOptions<unknown, EdenClientError<TRouter>>,
  ) => Promise<void>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientprefetchinfinitequery
   */
  prefetchInfiniteQuery: (
    queryKey: EdenQueryKey,
    opts?: EdenFetchInfiniteQueryOptions<unknown, unknown, EdenClientError<TRouter>>,
  ) => Promise<void>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientensurequerydata
   */
  ensureQueryData: (
    queryKey: EdenQueryKey,
    opts?: EdenFetchQueryOptions<unknown, EdenClientError<TRouter>>,
  ) => Promise<unknown>

  /**
   * @link https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation
   */
  invalidateQueries: (
    queryKey: EdenQueryKey,
    filters?: InvalidateQueryFilters,
    options?: InvalidateOptions,
  ) => Promise<void>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientresetqueries
   */
  resetQueries: (
    queryKey: EdenQueryKey,
    filters?: QueryFilters,
    options?: ResetOptions,
  ) => Promise<void>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientrefetchqueries
   */
  refetchQueries: (
    queryKey: EdenQueryKey,
    filters?: RefetchQueryFilters,
    options?: RefetchOptions,
  ) => Promise<void>

  /**
   * @link https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation
   */
  cancelQuery: (queryKey: EdenQueryKey, options?: CancelOptions) => Promise<void>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientsetquerydata
   */
  setQueryData: (
    queryKey: EdenQueryKey,
    updater: Updater<unknown, unknown>,
    options?: SetDataOptions,
  ) => void

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientsetqueriesdata
   */
  setQueriesData: (
    queryKey: EdenQueryKey,
    filters: QueryFilters,
    updater: Updater<unknown, unknown>,
    options?: SetDataOptions,
  ) => [QueryKey, unknown][]

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientgetquerydata
   */
  getQueryData: (queryKey: EdenQueryKey) => unknown

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientsetquerydata
   */
  setInfiniteQueryData: (
    queryKey: EdenQueryKey,
    updater: Updater<InfiniteData<unknown> | undefined, InfiniteData<unknown> | undefined>,
    options?: SetDataOptions,
  ) => void

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientgetquerydata
   */
  getInfiniteQueryData: (queryKey: EdenQueryKey) => InfiniteData<unknown> | undefined

  /**
   * @link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientsetmutationdefaults
   */
  setMutationDefaults: (
    mutationKey: EdenMutationKey,
    options:
      | MutationOptions
      | ((args: { canonicalMutationFn: (input: unknown) => Promise<unknown> }) => MutationOptions),
  ) => void

  /**
   * @link https://tanstack.com/query/latest/docs/reference/QueryClient#queryclientgetmutationdefaults
   */
  getMutationDefaults: (mutationKey: EdenMutationKey) => MutationOptions | undefined

  /**
   * @link https://tanstack.com/query/latest/docs/reference/QueryClient#queryclientismutating
   */
  isMutating: (filters: { mutationKey: EdenMutationKey }) => number
}

export const EdenQueryContext = React.createContext?.(null as any)

/**
 * @internal
 */
export type SSRState = 'mounted' | 'mounting' | 'prepass' | false

export interface EdenContextPropsBase<TElysia extends AnyElysia, TSSRContext> {
  /**
   * The `TRPCClient`
   */
  client: EdenClient<TElysia>

  /**
   * The SSR context when server-side rendering
   * @default null
   */
  ssrContext?: TSSRContext | null

  /**
   * State of SSR hydration.
   * - `false` if not using SSR.
   * - `prepass` when doing a prepass to fetch queries' data
   * - `mounting` before TRPCProvider has been rendered on the client
   * - `mounted` when the TRPCProvider has been rendered on the client
   * @default false
   */
  ssrState?: SSRState

  /**
   * @deprecated pass abortOnUnmount to `createTRPCReact` instead
   * Abort loading query calls when unmounting a component - usually when navigating to a new page
   * @default false
   */
  abortOnUnmount?: boolean
}

export interface EdenProviderProps<TRouter extends AnyElysia, TSSRContext>
  extends EdenContextProps<TRouter, TSSRContext> {
  children: React.ReactNode
}

export type EdenProvider<TRouter extends AnyElysia, TSSRContext> = (
  props: EdenProviderProps<TRouter, TSSRContext>,
) => JSX.Element

export const contextProps: (keyof EdenContextPropsBase<any, any>)[] = [
  'client',
  'ssrContext',
  'ssrState',
  'abortOnUnmount',
]

/**
 * this is the type that is used to add in procedures that can be used on
 * an entire router
 */
type DecorateRouter = {
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

/**
 * @internal
 */
export type DecoratedProcedureUtilsRecord<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = DecorateRouter & {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? DecoratedProcedureUtilsHooks<TSchema[K], TPath, K>
    : DecoratedProcedureUtilsRecord<TSchema[K], [...TPath, K]>
} // Add functions that should be available at utils root

/**
 * Entrypoint for assigning utility hooks to a procedure.
 */
type DecoratedProcedureUtilsHooks<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TMethod = '',
  TInput extends InferRouteOptions<TRoute> = InferRouteOptions<TRoute>,
> = TMethod extends HttpQueryMethod
  ? DecorateQueryProcedure<TRoute, TPath> &
      (InfiniteCursorKey extends keyof (TInput['params'] & TInput['query'])
        ? DecorateInfiniteQueryProcedure<TRoute, TPath>
        : {})
  : TMethod extends HttpMutationMethod
    ? DecorateMutationProcedure<TRoute, TPath>
    : never

export type DecorateQueryProcedure<
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
    /**
     * The input of the procedure
     */
    input: TInput,
    filters: QueryFilters,
    updater: Updater<TOutput | undefined, TOutput | undefined>,
    options?: SetDataOptions,
  ): [QueryKey, TOutput]

  getData: (input: TInput) => TOutput | undefined

  options: (
    input: TInput,
    options?: UseQueryOptions<TOutput, TError>,
  ) => UseQueryOptions<TOutput, TError>
}

export type DecorateInfiniteQueryProcedure<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TKey extends QueryKey = EdenQueryKey<TPath, TInput>,
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
    options?: EdenUseInfiniteQueryOptions<TInput, TOutput, TError>,
  ) => UseInfiniteQueryOptions<TOutput, TError, TOutput, TKey>
}

export type DecorateMutationProcedure<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteBody<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  _TKey extends QueryKey = EdenQueryKey<TPath, TInput>,
> = {
  setMutationDefaults(
    options:
      | EdenUseMutationOptions<TInput, TError, TOutput>
      | ((args: {
          canonicalMutationFn: NonNullable<
            EdenUseMutationOptions<TInput, TError, TOutput>['mutationFn']
          >
        }) => EdenUseMutationOptions<TInput, TError, TOutput>),
  ): void

  getMutationDefaults(): EdenUseMutationOptions<TInput, TError, TOutput> | undefined

  isMutating(): number
}

/**
 * @internal
 */
export type DecoratedTRPCContextProps<
  TElysia extends AnyElysia,
  TSSRContext,
> = EdenContextPropsBase<TElysia, TSSRContext> & {
  client: CreateEdenClient<TElysia>
}

export type CreateReactUtils<TElysia extends AnyElysia, TSSRContext> = ProtectedIntersection<
  DecoratedTRPCContextProps<TElysia, TSSRContext>,
  DecoratedProcedureUtilsRecord<TElysia['_routes']>
>

/**
 * @internal
 */
export function createReactQueryUtils<TRouter extends AnyElysia, TSSRContext>(
  context: EdenContextState<TRouter, TSSRContext>,
): CreateReactUtils<TRouter, TSSRContext> {
  // const clientProxy = createTRPCClientProxy(context.client)

  const proxy = createReactQueryUtilsProxy(context)

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

export function getQueryType(utilName: string): EdenQueryType {
  switch (utilName) {
    case 'fetch':
    case 'ensureData':
    case 'prefetch':
    case 'getData':
    case 'setData':
    case 'setQueriesData':
      return 'query'

    case 'fetchInfinite':
    case 'prefetchInfinite':
    case 'getInfiniteData':
    case 'setInfiniteData':
      return 'infinite'

    case 'setMutationDefaults':
    case 'getMutationDefaults':
    case 'isMutating':
    case 'cancel':
    case 'invalidate':
    case 'refetch':
    case 'reset':
      return 'any'
  }

  return 'any'
}

export function createReactQueryUtilsProxy<TRouter extends AnyElysia, TSSRContext>(
  context: EdenContextState<TRouter, TSSRContext>,
  paths: string[] = [],
): CreateReactUtils<TRouter, TSSRContext> {
  const proxy = new Proxy(() => {}, {
    get: (_target, path: string, _receiver) => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createReactQueryUtilsProxy(context, nextPaths)
    },
    apply: (_target, _thisArg, argArray) => {
      const pathsCopy = [...paths]

      const lastArg = pathsCopy.pop() ?? ''

      let method = pathsCopy[pathsCopy.length - 1]

      if (isHttpMethod(method)) {
        pathsCopy.pop()
      }

      const argsCopy = [...argArray]

      const input = argsCopy.shift() // args can now be spread when input removed

      const queryType = getQueryType(lastArg)

      const queryKey = getQueryKey(pathsCopy, input, queryType)

      switch (lastArg) {
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
          return context.setMutationDefaults(getMutationKey(pathsCopy), input)
        }

        case 'getMutationDefaults': {
          return context.getMutationDefaults(getMutationKey(pathsCopy))
        }

        case 'isMutating': {
          return context.isMutating({ mutationKey: getMutationKey(pathsCopy) })
        }

        default: {
          throw new TypeError(`eden.${paths.join('.')} is not a function`)
        }
      }
    },
  })

  return proxy as any
}

/**
 * Creates a set of utility functions that can be used to interact with `react-query`
 * @param options the `TRPCClient` and `QueryClient` to use
 * @returns a set of utility functions that can be used to interact with `react-query`
 * @internal
 */
export function createUtilityFunctions<T extends AnyElysia>(
  options: EdenCreateReactQueryUtilsOptions<T>,
): EdenQueryUtils<T> {
  const { client, queryClient } = options

  return {
    fetchQuery: async (queryKey, options = {}) => {
      const { path, method } = parsePathsAndMethod(queryKey[0])

      const { eden, ...queryOptions } = options

      const edenQueryOptions: FetchQueryOptions<unknown, any, unknown, QueryKey, never> = {
        ...queryOptions,
        queryKey,
        queryFn: async () => {
          let options: any = queryKey[1]?.input

          const params: EdenRequestParams = {
            ...eden,
            options,
            path,
            method,
            fetcher: eden?.fetcher ?? globalThis.fetch,
          }

          const result = await client.query(params)

          if (result.error != null) {
            throw result.error
          }

          return result.data
        },
      }

      return await queryClient.fetchQuery(edenQueryOptions)
    },

    fetchInfiniteQuery: async (queryKey, options) => {
      const path = '/' + queryKey[0].join('/')

      let input: any = queryKey[1]?.input

      const params: EdenRequestParams = { path, options: input, ...options }

      return await queryClient.fetchInfiniteQuery({
        ...options,
        queryKey,
        queryFn: async (context) => {
          const resolvedParams = { ...params }

          if (resolvedParams.options?.query != null) {
            ;(resolvedParams.options.query as any)['cursor'] = context.pageParam
            ;(resolvedParams.options.query as any)['direction'] = context.direction
          }

          if (resolvedParams.options?.params != null) {
            ;(resolvedParams.options.params as any)['cursor'] = context.pageParam
            ;(resolvedParams.options.params as any)['direction'] = context.direction
          }

          const result = await client.query(resolvedParams)

          if (result.error != null) {
            throw result.error
          }

          return result.data
        },
        initialPageParam: options?.initialCursor ?? null,
      })
    },

    prefetchQuery: async (queryKey, options) => {
      const path = '/' + queryKey[0].join('/')

      let input: any = queryKey[1]?.input

      const params: EdenRequestParams = { path, options: input, ...options }

      return await queryClient.prefetchQuery({
        ...options,
        queryKey,
        queryFn: async () => {
          const resolvedParams = { ...params }

          const result = await client.query(resolvedParams)

          if (result.error != null) {
            throw result.error
          }

          return result.data
        },
      })
    },

    prefetchInfiniteQuery: async (queryKey, options) => {
      const path = '/' + queryKey[0].join('/')

      let input: any = queryKey[1]?.input

      const params: EdenRequestParams = { path, options: input, ...options }

      return await queryClient.prefetchInfiniteQuery({
        ...options,
        queryKey,
        queryFn: async (context) => {
          const resolvedParams = { ...params }

          if (resolvedParams.options?.query != null) {
            ;(resolvedParams.options.query as any)['cursor'] = context.pageParam
            ;(resolvedParams.options.query as any)['direction'] = context.direction
          }

          if (resolvedParams.options?.params != null) {
            ;(resolvedParams.options.params as any)['cursor'] = context.pageParam
            ;(resolvedParams.options.params as any)['direction'] = context.direction
          }

          const result = await client.query(resolvedParams)

          if (result.error != null) {
            throw result.error
          }

          return result.data
        },
        initialPageParam: options?.initialCursor ?? null,
      })
    },

    ensureQueryData: async (queryKey, options) => {
      const path = '/' + queryKey[0].join('/')

      let input: any = queryKey[1]?.input

      const params: EdenRequestParams = { path, options: input, ...options }

      return await queryClient.ensureQueryData({
        ...options,
        queryKey,
        queryFn: async () => {
          const resolvedParams: EdenRequestParams = { ...params }

          const result = await client.query(resolvedParams)

          if (result.error != null) {
            throw result.error
          }

          return result.data
        },
      })
    },

    invalidateQueries: async (queryKey, filters, options) => {
      return await queryClient.invalidateQueries({ ...filters, queryKey }, options)
    },

    resetQueries: async (queryKey, filters, options) => {
      return await queryClient.resetQueries({ ...filters, queryKey }, options)
    },

    refetchQueries: async (queryKey, filters, options) => {
      return await queryClient.refetchQueries({ ...filters, queryKey }, options)
    },

    cancelQuery: async (queryKey, options) => {
      return await queryClient.cancelQueries({ queryKey }, options)
    },

    setQueryData: (queryKey, updater, options) => {
      return queryClient.setQueryData(queryKey, updater as any, options)
    },

    setQueriesData: (queryKey, filters, updater, options) => {
      return queryClient.setQueriesData({ ...filters, queryKey }, updater, options)
    },

    getQueryData: (queryKey) => {
      return queryClient.getQueryData(queryKey)
    },

    setInfiniteQueryData: (queryKey, updater, options) => {
      return queryClient.setQueryData(queryKey, updater as any, options)
    },

    getInfiniteQueryData: (queryKey) => {
      return queryClient.getQueryData(queryKey)
    },

    setMutationDefaults: (mutationKey, options) => {
      const path = '/' + mutationKey[0].join('/')

      const canonicalMutationFn = async (input: unknown) => {
        return await client.mutation({ path, body: input })
      }

      const mutationOptions =
        typeof options === 'function' ? options({ canonicalMutationFn }) : options

      return queryClient.setMutationDefaults(mutationKey, mutationOptions)
    },

    getMutationDefaults: (mutationKey) => {
      return queryClient.getMutationDefaults(mutationKey)
    },

    isMutating: (filters) => {
      return queryClient.isMutating({ ...filters, exact: true })
    },
  }
}

export type EdenContextProps<TRouter extends AnyElysia, TSSRContext> = EdenContextPropsBase<
  TRouter,
  TSSRContext
> & {
  /**
   * The react-query `QueryClient`
   */
  queryClient: QueryClient
}

export type EdenContextState<TRouter extends AnyElysia, TSSRContext = undefined> = Required<
  EdenContextProps<TRouter, TSSRContext>
> &
  EdenQueryUtils<TRouter>
