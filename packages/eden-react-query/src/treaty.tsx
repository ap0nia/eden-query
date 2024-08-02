import {
  EdenClient,
  type EdenClientOptions,
  type EdenRequestOptions,
  type EdenRequestParams,
} from '@elysiajs/eden'
import { isHttpMethod } from '@elysiajs/eden/utils/http.ts'
import type {
  CancelOptions,
  InfiniteData,
  InvalidateOptions,
  InvalidateQueryFilters,
  MutationOptions,
  QueryFilters,
  QueryKey,
  QueryObserverOptions,
  RefetchOptions,
  RefetchQueryFilters,
  ResetOptions,
  SetDataOptions,
  UndefinedInitialDataInfiniteOptions,
  Updater,
  UseMutationOptions,
  UseSuspenseInfiniteQueryOptions,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query'
import {
  hashKey,
  QueryClient,
  skipToken,
  useInfiniteQuery as __useInfiniteQuery,
  useMutation as __useMutation,
  useQueries as __useQueries,
  useQuery as __useQuery,
  useQueryClient,
  useSuspenseInfiniteQuery as __useSuspenseInfiniteQuery,
  useSuspenseQueries as __useSuspenseQueries,
  useSuspenseQuery as __useSuspenseQuery,
} from '@tanstack/react-query'
import type { AnyElysia, MaybePromise } from 'elysia'
import * as React from 'react'

import {
  createReactQueryUtils,
  createUtilityFunctions,
  type EdenCreateReactQueryUtilsOptions,
  type EdenProvider,
} from './context'
import type { EdenTreatyQueryHooks } from './hooks'
import {
  type EdenMutationKey,
  type EdenQueryKey as EdenQueryKey,
  getMutationKey,
  getQueryKey,
} from './query-key'
import { useHookResult } from './use-hook-result'
import type {
  EdenFetchInfiniteQueryOptions,
  EdenUseInfiniteQueryOptions,
  EdenUseInfiniteQueryResult,
} from './use-infinite-query'
import type {
  EdenUseMutationOptions,
  EdenUseMutationResult,
  EdenUseMutationVariables,
} from './use-mutation'
import { createUseQueriesProxy, type EdenUseQueries } from './use-queries'
import type {
  EdenFetchQueryOptions,
  EdenQueryOptions,
  EdenUseQueryOptions,
  EdenUseQueryResult,
} from './use-query'
import type { EdenUseSubscriptionOptions } from './use-subscription'
import type {
  EdenUseSuspenseInfiniteQueryOptions,
  EdenUseSuspenseInfiniteQueryResult,
} from './use-suspense-infinite-query'
import { createUseSuspenseQueriesProxy, type EdenUseSuspenseQueries } from './use-suspense-queries'
import type { EdenUseSuspenseQueryOptions, EdenUseSuspenseQueryResult } from './use-suspense-query'
import { isAsyncIterable } from './utils/is-async-iterable'

/**
 * @internal
 */
export type SSRState = 'mounted' | 'mounting' | 'prepass' | false

export interface TRPCContextPropsBase<TElysia extends AnyElysia, TSSRContext> {
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

/**
 * @internal
 */
export type DecoratedTRPCContextProps<
  TElysia extends AnyElysia,
  TSSRContext,
> = TRPCContextPropsBase<TElysia, TSSRContext> & {
  client: CreateEdenClient<TElysia>
}

export interface TRPCContextProps<TElysia extends AnyElysia, TSSRContext>
  extends TRPCContextPropsBase<TElysia, TSSRContext> {
  /**
   * The react-query `QueryClient`
   */
  queryClient: QueryClient
}

export const contextProps: (keyof TRPCContextPropsBase<any, any>)[] = [
  'client',
  'ssrContext',
  'ssrState',
  'abortOnUnmount',
]

/**
 * @internal
 */
export interface TRPCContextState<TRouter extends AnyElysia, TSSRContext = undefined>
  extends Required<TRPCContextProps<TRouter, TSSRContext>>,
    TRPCQueryUtils<TRouter> {}

/**
 * @TODO
 */
type EdenClientError<_T extends AnyElysia> = any

/**
 * @internal
 */
export interface TRPCQueryUtils<T extends AnyElysia> {
  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientfetchquery
   */
  fetchQuery: (
    queryKey: EdenQueryKey,
    opts?: EdenFetchQueryOptions<unknown, EdenClientError<T>>,
  ) => Promise<unknown>
  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientfetchinfinitequery
   */
  fetchInfiniteQuery: (
    queryKey: EdenQueryKey,
    opts?: EdenFetchInfiniteQueryOptions<unknown, unknown, EdenClientError<T>>,
  ) => Promise<InfiniteData<unknown, unknown>>
  /**
   * @link https://tanstack.com/query/v5/docs/framework/react/guides/prefetching
   */
  prefetchQuery: (
    queryKey: EdenQueryKey,
    opts?: EdenFetchQueryOptions<unknown, EdenClientError<T>>,
  ) => Promise<void>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientprefetchinfinitequery
   */
  prefetchInfiniteQuery: (
    queryKey: EdenQueryKey,
    opts?: EdenFetchInfiniteQueryOptions<unknown, unknown, EdenClientError<T>>,
  ) => Promise<void>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientensurequerydata
   */
  ensureQueryData: (
    queryKey: EdenQueryKey,
    opts?: EdenFetchQueryOptions<unknown, EdenClientError<T>>,
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

export const TRPCContext = React.createContext?.(null as any)

/**
 * @internal
 */
export interface UseMutationOverride {
  onSuccess: (opts: {
    /**
     * Calls the original function that was defined in the query's `onSuccess` option
     */
    originalFn: () => MaybePromise<unknown>

    queryClient: QueryClient
    /**
     * Meta data passed in from the `useMutation()` hook
     */
    meta: Record<string, unknown>
  }) => MaybePromise<unknown>
}

export type CreateEdenReactQueryOptions<T extends AnyElysia = AnyElysia> =
  /**
   * Use svelte-query's internal AbortSignals instead of allowing user provided signals.
   */
  Omit<EdenRequestOptions<T>, 'signal'> & {
    /**
     * Override behaviors of the built-in hooks
     */
    overrides?: {
      useMutation?: Partial<UseMutationOverride>
    }

    /**
     * Abort all queries when unmounting
     * @default false
     */
    abortOnUnmount?: boolean

    /**
     * Override the default context provider
     * @default undefined
     */
    context?: React.Context<any>
  }

/**
 * @todo
 */
type EdenClientErrorLike<_T extends AnyElysia> = any

export const ERROR_SYMBOL = Symbol('TypeError')

export type TypeError<TMessage extends string> = TMessage & {
  _: typeof ERROR_SYMBOL
}

export type CreateEdenClient<T extends AnyElysia = AnyElysia> = (
  options: EdenClientOptions<T>,
) => EdenClient<T>

function isServerQuery(
  ssrState: SSRState,
  options: EdenUseQueryOptions<any, any, any> = {},
  defaultOpts: Partial<QueryObserverOptions>,
  isInputSkipToken: boolean,
  queryClient: QueryClient,
  queryKey: QueryKey,
): boolean {
  // Not server.
  if (typeof window !== 'undefined') return false

  // Invalid SSR state for server.
  if (ssrState !== 'prepass') return false

  // Did not enable SSR.
  if (options?.eden?.ssr === false) return false

  // Query is not enabled.
  if (options?.enabled || defaultOpts?.enabled) return false

  // Skip this query.
  if (isInputSkipToken) return false

  // Query has already been cached.
  if (queryClient.getQueryCache().find({ queryKey })) return false

  return true
}

/**
 * @internal
 */
export function createRootHooks<
  TElysia extends AnyElysia,
  TSSRContext = unknown,
  TError = EdenClientErrorLike<TElysia>,
>(config?: CreateEdenReactQueryOptions<TElysia>) {
  type ProviderContext = TRPCContextState<TElysia, TSSRContext>

  const Context = (config?.context ?? TRPCContext) as React.Context<ProviderContext>

  const createClient: CreateEdenClient<TElysia> = (options) => {
    return new EdenClient(options)
  }

  const TRPCProvider: EdenProvider<TElysia, TSSRContext> = (props) => {
    const { abortOnUnmount = false, client, queryClient, ssrContext } = props

    const [ssrState, setSSRState] = React.useState<SSRState>(props.ssrState ?? false)

    const utilityFunctions = React.useMemo(() => {
      return createUtilityFunctions({ client, queryClient })
    }, [client, queryClient])

    const contextValue = React.useMemo<ProviderContext>(() => {
      return {
        abortOnUnmount,
        queryClient,
        client,
        ssrContext: ssrContext ?? null,
        ssrState,
        ...utilityFunctions,
      }
    }, [abortOnUnmount, client, utilityFunctions, queryClient, ssrContext, ssrState])

    React.useEffect(() => {
      // Only updating state to `mounted` if we are using SSR.
      // This makes it so we don't have an unnecessary re-render when opting out of SSR.
      setSSRState((state) => (state ? 'mounted' : false))
    }, [])

    return <Context.Provider value={contextValue}> {props.children} </Context.Provider>
  }

  function useContext() {
    const context = React.useContext(Context)

    if (!context) {
      throw new Error(
        'Unable to find tRPC Context. Did you forget to wrap your App inside `withTRPC` HoC?',
      )
    }

    return context
  }

  /**
   * Hack to make sure errors return `status`='error` when doing SSR
   * @link https://github.com/trpc/trpc/pull/1645
   */
  function useSSRQueryOptionsIfNeeded<TOptions extends { retryOnMount?: boolean } | undefined>(
    queryKey: EdenQueryKey,
    options: TOptions,
  ): TOptions {
    const { queryClient, ssrState } = useContext()

    const resolvedOptions = { ...options } as NonNullable<TOptions>

    if (!ssrState || ssrState === 'mounted') {
      return resolvedOptions
    }

    const queryCache = queryClient.getQueryCache()

    const query = queryCache.find({ queryKey })

    if (query?.state.status === 'error') {
      resolvedOptions.retryOnMount = false
    }

    return resolvedOptions
  }

  function useQuery(
    originalPaths: readonly string[],
    input: any,
    options?: EdenUseQueryOptions<unknown, unknown, TError>,
  ): EdenUseQueryResult<unknown, TError> {
    const paths = [...originalPaths]

    /**
     * This may be the method, or part of a route.
     *
     * e.g. since invalidations can be partial and not include it.
     *
     * @example
     *
     * Let there be a GET endpoint at /api/hello/world
     *
     * GET request to /api/hello/world -> paths = ['api', 'hello', 'world', 'get']
     *
     * Invalidation request for all routes under /api/hello -> paths = ['api', 'hello']
     *
     * In the GET request, the last item is the method and can be safely popped.
     * In the invalidation, the last item is actually part of the path, so it needs to be preserved.
     */
    let method = paths[paths.length - 1]

    if (isHttpMethod(method)) {
      paths.pop()
    }

    const path = '/' + paths.join('/')

    const context = useContext()

    const { abortOnUnmount, client, ssrState, queryClient, prefetchQuery } = context

    const queryKey = getQueryKey(paths, input, 'query')

    const defaultOptions = queryClient.getQueryDefaults(queryKey)

    const isInputSkipToken = input === skipToken

    if (isServerQuery(ssrState, options, defaultOptions, isInputSkipToken, queryClient, queryKey)) {
      void prefetchQuery(queryKey, options)
    }

    const initialQueryOptions = { ...defaultOptions, ...options }

    const { eden, ...queryOptions } = useSSRQueryOptionsIfNeeded(queryKey, initialQueryOptions)

    const resolvedQueryOptions = { ...queryOptions, queryKey }

    const shouldAbortOnUnmount = eden?.abortOnUnmount ?? config?.abortOnUnmount ?? abortOnUnmount

    if (isInputSkipToken) {
      resolvedQueryOptions.queryFn = input
    } else {
      const params: EdenRequestParams = {
        ...config,
        ...eden,
        path,
        fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
      }

      resolvedQueryOptions.queryFn = async (queryFunctionContext) => {
        const resolvedParams = { ...params }

        if (shouldAbortOnUnmount) {
          resolvedParams.fetch = { ...resolvedParams.fetch }
          resolvedParams.fetch.signal = queryFunctionContext.signal
        }

        const result = await client.query(resolvedParams)

        // TODO: how to get async iterable here?

        if (isAsyncIterable(result)) {
          const queryCache = queryClient.getQueryCache()

          const query = queryCache.build(queryFunctionContext.queryKey, { queryKey })

          query.setState({ data: [], status: 'success' })

          const aggregate: unknown[] = []

          for await (const value of result) {
            aggregate.push(value)

            query.setState({ data: [...aggregate] })
          }

          return aggregate
        }

        if (result.error != null) {
          throw result.error
        }

        return result.data
      }
    }

    type HookResult = EdenUseQueryResult<any, TError>

    const hook = __useQuery(resolvedQueryOptions, queryClient) as HookResult

    hook.eden = useHookResult({ path: paths })

    return hook
  }

  function useSuspenseQuery(
    originalPaths: readonly string[],
    input: any,
    options?: EdenUseSuspenseQueryOptions<unknown, unknown, TError>,
  ): EdenUseSuspenseQueryResult<unknown, TError> {
    const paths = [...originalPaths]

    /**
     * This may be the method, or part of a route.
     *
     * e.g. since invalidations can be partial and not include it.
     *
     * @example
     *
     * Let there be a GET endpoint at /api/hello/world
     *
     * GET request to /api/hello/world -> paths = ['api', 'hello', 'world', 'get']
     *
     * Invalidation request for all routes under /api/hello -> paths = ['api', 'hello']
     *
     * In the GET request, the last item is the method and can be safely popped.
     * In the invalidation, the last item is actually part of the path, so it needs to be preserved.
     */
    let method = paths[paths.length - 1]

    if (isHttpMethod(method)) {
      paths.pop()
    }

    const queryKey = getQueryKey(paths, input, 'query')

    const context = useContext()

    const { queryClient, abortOnUnmount } = context

    const defaultOptions = queryClient.getQueryDefaults(queryKey)

    const isInputSkipToken = input === skipToken

    const { eden, ...queryOptions } = options ?? {}

    const shouldAbortOnUnmount = eden?.abortOnUnmount ?? config?.abortOnUnmount ?? abortOnUnmount

    const path = '/' + paths.join('/')

    const params: EdenRequestParams = {
      ...config,
      ...eden,
      path,
      fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
    }

    const resolvedQueryOptions = { ...defaultOptions, ...queryOptions, queryKey }

    if (isInputSkipToken) {
      resolvedQueryOptions.queryFn = input
    } else {
      resolvedQueryOptions.queryFn = async (queryFunctionContext) => {
        const resolvedParams = { ...params }

        if (shouldAbortOnUnmount) {
          resolvedParams.fetch = { ...resolvedParams.fetch }
          resolvedParams.fetch.signal = queryFunctionContext.signal
        }

        const result = await context.client.query(resolvedParams)

        if (result.error != null) {
          throw result.error
        }

        return result.data
      }
    }

    type HookResult = EdenUseQueryResult<any, TError>

    const hook = __useSuspenseQuery(resolvedQueryOptions, queryClient) as HookResult

    hook.eden = useHookResult({ path: paths })

    return [hook.data, hook as any]
  }

  function useMutation(
    originalPaths: readonly string[],
    options?: EdenUseMutationOptions<unknown, TError, unknown, unknown>,
  ): EdenUseMutationResult<unknown, TError, unknown, unknown> {
    const paths = [...originalPaths]

    /**
     * This may be the method, or part of a route.
     *
     * e.g. since invalidations can be partial and not include it.
     *
     * @example
     *
     * Let there be a GET endpoint at /api/hello/world
     *
     * GET request to /api/hello/world -> paths = ['api', 'hello', 'world', 'get']
     *
     * Invalidation request for all routes under /api/hello -> paths = ['api', 'hello']
     *
     * In the GET request, the last item is the method and can be safely popped.
     * In the invalidation, the last item is actually part of the path, so it needs to be preserved.
     */
    let method = paths[paths.length - 1]

    if (isHttpMethod(method)) {
      paths.pop()
    }

    const { client } = useContext()

    const queryClient = useQueryClient()

    const mutationKey = getMutationKey(paths)

    const mutationDefaults = queryClient.getMutationDefaults(mutationKey)

    const defaultOptions = queryClient.defaultMutationOptions(mutationDefaults)

    const mutationOptions: UseMutationOptions<unknown, TError, unknown, unknown> = {
      ...options,
      mutationKey: mutationKey,
      mutationFn: async (variables: any = {}) => {
        const { body, options } = variables as EdenUseMutationVariables

        const path = '/' + paths.join('/')

        const resolvedParams: EdenRequestParams = { path, body, ...options }

        const result = await client.query(resolvedParams)

        if (!('data' in result)) {
          return result
        }

        if (result.error != null) {
          throw result.error
        }

        return result.data
      },
      onSuccess: (data, variables, context) => {
        if (config?.overrides?.useMutation?.onSuccess == null) {
          return mutationOptions?.onSuccess?.(data, variables, context)
        }

        const meta: any = mutationOptions?.meta ?? defaultOptions.meta

        const originalFn = () => mutationOptions?.onSuccess?.(data, variables, context)

        return config.overrides.useMutation.onSuccess({ meta, originalFn, queryClient })
      },
    }

    type HookResult = EdenUseMutationResult<unknown, TError, unknown, unknown>

    const hook = __useMutation(mutationOptions, queryClient) as HookResult

    hook.eden = useHookResult({ path: paths })

    return hook
  }

  /* istanbul ignore next -- @preserve */
  function useSubscription(
    path: readonly string[],
    input: unknown,
    opts: EdenUseSubscriptionOptions<unknown, TError>,
  ) {
    const enabled = opts?.enabled ?? input !== skipToken

    const queryKey = hashKey(getQueryKey(path, input as any, 'any'))

    const { client } = useContext()

    const optsRef = React.useRef<typeof opts>(opts)

    optsRef.current = opts

    React.useEffect(() => {
      if (!enabled) {
        return
      }

      let isStopped = false

      const params: EdenRequestParams<TElysia> = {
        path: path.join('.'),
        ...(input ?? {}),
      }

      const subscription = client.subscription(params, {
        onStarted: () => {
          if (!isStopped) {
            optsRef.current.onStarted?.()
          }
        },
        onData: (data) => {
          if (!isStopped) {
            optsRef.current.onData(data)
          }
        },
        onError: (err) => {
          if (!isStopped) {
            optsRef.current.onError?.(err)
          }
        },
      })

      return () => {
        isStopped = true
        subscription.unsubscribe()
      }
    }, [queryKey, enabled])
  }

  function useInfiniteQuery(
    originalPaths: readonly string[],
    input: any,
    options: EdenUseInfiniteQueryOptions<unknown, unknown, TError>,
  ): EdenUseInfiniteQueryResult<unknown, TError, unknown> {
    const paths = [...originalPaths]

    /**
     * This may be the method, or part of a route.
     *
     * e.g. since invalidations can be partial and not include it.
     *
     * @example
     *
     * Let there be a GET endpoint at /api/hello/world
     *
     * GET request to /api/hello/world -> paths = ['api', 'hello', 'world', 'get']
     *
     * Invalidation request for all routes under /api/hello -> paths = ['api', 'hello']
     *
     * In the GET request, the last item is the method and can be safely popped.
     * In the invalidation, the last item is actually part of the path, so it needs to be preserved.
     */
    let method = paths[paths.length - 1]

    if (isHttpMethod(method)) {
      paths.pop()
    }

    const path = '/' + paths.join('/')

    const context = useContext()

    const { client, ssrState, prefetchInfiniteQuery, queryClient, abortOnUnmount } = context

    const queryKey = getQueryKey(path, input, 'infinite')

    const defaultOptions = queryClient.getQueryDefaults(queryKey)

    const isInputSkipToken = input === skipToken

    const initialQueryOptions = { ...defaultOptions, ...options }

    if (isServerQuery(ssrState, options, defaultOptions, isInputSkipToken, queryClient, queryKey)) {
      void prefetchInfiniteQuery(queryKey, initialQueryOptions as any)
    }

    const { eden, ...ssrQueryOptions } = useSSRQueryOptionsIfNeeded(queryKey, initialQueryOptions)

    // request option should take priority over global
    const shouldAbortOnUnmount = eden?.abortOnUnmount ?? config?.abortOnUnmount ?? abortOnUnmount

    type InfiniteQueryOptions = UndefinedInitialDataInfiniteOptions<
      unknown,
      TError,
      unknown,
      any,
      unknown
    >

    const params: EdenRequestParams = {
      ...config,
      ...eden,
      fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
    }

    const queryOptions = {
      ...ssrQueryOptions,
      initialPageParam: ssrQueryOptions.initialCursor ?? null,
      queryKey,
    } as InfiniteQueryOptions

    if (isInputSkipToken) {
      queryOptions.queryFn = input
    } else {
      queryOptions.queryFn = async (queryFunctionContext) => {
        const resolvedParams = { ...params }

        if (shouldAbortOnUnmount) {
          resolvedParams.fetch = { ...resolvedParams.fetch }
          resolvedParams.fetch.signal = queryFunctionContext.signal
        }

        const result = await client.query(resolvedParams)

        if (result.error != null) {
          throw result.error
        }

        return result.data
      }
    }

    type HookResult = EdenUseInfiniteQueryResult<unknown, TError, unknown>

    const hook = __useInfiniteQuery(queryOptions, queryClient) as HookResult

    hook.eden = useHookResult({ path: paths })

    return hook
  }

  function useSuspenseInfiniteQuery(
    originalPaths: readonly string[],
    input: any,
    options: EdenUseSuspenseInfiniteQueryOptions<unknown, unknown, TError>,
  ): EdenUseSuspenseInfiniteQueryResult<unknown, TError, unknown> {
    const paths = [...originalPaths]

    /**
     * This may be the method, or part of a route.
     *
     * e.g. since invalidations can be partial and not include it.
     *
     * @example
     *
     * Let there be a GET endpoint at /api/hello/world
     *
     * GET request to /api/hello/world -> paths = ['api', 'hello', 'world', 'get']
     *
     * Invalidation request for all routes under /api/hello -> paths = ['api', 'hello']
     *
     * In the GET request, the last item is the method and can be safely popped.
     * In the invalidation, the last item is actually part of the path, so it needs to be preserved.
     */
    let method = paths[paths.length - 1]

    if (isHttpMethod(method)) {
      paths.pop()
    }

    const path = '/' + paths.join('/')

    const queryKey = getQueryKey(path, input, 'infinite')

    const context = useContext()

    const { queryClient, abortOnUnmount } = context

    const defaultOptions = queryClient.getQueryDefaults(queryKey)

    const initialQueryOptions = { ...defaultOptions, ...options }

    const { eden, ...ssrQueryOptions } = useSSRQueryOptionsIfNeeded(queryKey, initialQueryOptions)

    // request option should take priority over global
    const shouldAbortOnUnmount = eden?.abortOnUnmount ?? config?.abortOnUnmount ?? abortOnUnmount

    const params: EdenRequestParams = {
      ...config,
      ...eden,
      fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
    }

    const queryOptions = {
      ...ssrQueryOptions,
      initialPageParam: options.initialCursor ?? null,
      queryKey,
      queryFn: async (queryFunctionContext) => {
        const resolvedParams = { ...params }

        if (shouldAbortOnUnmount) {
          resolvedParams.fetch = { ...resolvedParams.fetch }
          resolvedParams.fetch.signal = queryFunctionContext.signal
        }

        const result = await context.client.query(resolvedParams)

        if (result.error != null) {
          throw result.error
        }

        return result.data
      },
    } as UseSuspenseInfiniteQueryOptions

    type HookResult = EdenUseInfiniteQueryResult<unknown, TError, unknown>

    const hook = __useSuspenseInfiniteQuery(queryOptions, context.queryClient) as HookResult

    hook.eden = useHookResult({ path: paths })

    return [hook.data, hook] as any
  }

  const useQueries: EdenUseQueries<TElysia> = (queriesCallback) => {
    const context = useContext()

    const { ssrState, queryClient, prefetchQuery, client } = context

    const proxy = createUseQueriesProxy(client)

    const queries: readonly EdenQueryOptions<any, any>[] = queriesCallback(proxy)

    // Not SSR.
    if (!(typeof window === 'undefined' && ssrState === 'prepass')) {
      return __useQueries({ queries }, queryClient)
    }

    for (const query of queries) {
      const queryOption = query as EdenQueryOptions<any, any>

      const shouldSsr = queryOption.eden?.ssr !== false

      if (shouldSsr && !queryClient.getQueryCache().find({ queryKey: queryOption.queryKey })) {
        void prefetchQuery(queryOption.queryKey, queryOption)
      }
    }

    return __useQueries({ queries }, queryClient)
  }

  const useSuspenseQueries: EdenUseSuspenseQueries<TElysia> = (queriesCallback) => {
    const context = useContext()

    const { queryClient, client } = context

    const proxy = createUseSuspenseQueriesProxy(client)

    const queries: readonly UseSuspenseQueryOptions<any, any>[] = queriesCallback(proxy)

    const hook = __useSuspenseQueries({ queries }, queryClient)

    return [hook.map((h) => h.data), hook] as any
  }

  return {
    Provider: TRPCProvider,
    createClient,
    useContext,
    useUtils: useContext,
    useQuery,
    useSuspenseQuery,
    useQueries,
    useSuspenseQueries,
    useMutation,
    useSubscription,
    useInfiniteQuery,
    useSuspenseInfiniteQuery,
  }
}

/**
 * @internal
 */
export type EdenTreatyReactQueryBase<TElysia extends AnyElysia, TSSRContext> = {
  /**
   * @deprecated renamed to `useUtils` and will be removed in a future tRPC version
   *
   * @link https://trpc.io/docs/v11/client/react/useUtils
   */
  useContext(): EdenCreateReactQueryUtilsOptions<TElysia, TSSRContext>

  /**
   * @link https://trpc.io/docs/v11/client/react/useUtils
   */
  useUtils(): EdenCreateReactQueryUtilsOptions<TElysia, TSSRContext>

  Provider: EdenProvider<TElysia, TSSRContext>

  createClient: CreateEdenClient<TElysia>

  useQueries: EdenUseQueries<TElysia>

  useSuspenseQueries: EdenUseSuspenseQueries<TElysia>
}

/**
 * Infer the type of a `createReactQueryHooks` function
 * @internal
 */
export type CreateEdenTreatyReactQueryRootHooks<
  TElysia extends AnyElysia,
  TSSRContext = unknown,
> = ReturnType<typeof createRootHooks<TElysia, TSSRContext>>

export type CreateEdenTreatyReactQueryHooks<
  TElysia extends AnyElysia,
  TSSRContext = unknown,
> = CreateEdenTreatyReactQueryRootHooks<TElysia, TSSRContext> & EdenTreatyQueryHooks<TElysia>

export function createEdenTreatyReactQueryProxy<T extends AnyElysia = AnyElysia>(
  rootHooks: CreateEdenTreatyReactQueryRootHooks<T>,
  config?: CreateEdenReactQueryOptions<T>,
  paths: string[] = [],
) {
  const edenTreatyReactQueryProxy = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createEdenTreatyReactQueryProxy(rootHooks, config, nextPaths)
    },
    apply: (_target, _thisArg, args) => {
      const pathsCopy = [...paths]
      /**
       * @example 'createQuery'
       */
      const hook = pathsCopy.pop() ?? ''

      if (hook === 'useMutation') {
        return rootHooks.useMutation(pathsCopy, ...args)
      }

      const [input, ...rest] = args

      const options = rest[0] || {}

      return (rootHooks as any)[hook](pathsCopy, input, options)
    },
  })

  return edenTreatyReactQueryProxy
}

export function createEdenTreatyReactQuery<TElysia extends AnyElysia, TSSRContext = unknown>(
  config?: CreateEdenReactQueryOptions<TElysia>,
): CreateEdenTreatyReactQueryHooks<TElysia, TSSRContext> {
  const rootHooks = createRootHooks(config)

  const edenTreatyReactQueryProxy = createEdenTreatyReactQueryProxy(rootHooks, config)

  const edenTreatyReactQuery = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      if (path === 'useContext' || path === 'useUtils') {
        return () => {
          const context = rootHooks.useUtils()

          // create a stable reference of the utils context
          return React.useMemo(() => {
            return createReactQueryUtils(context)
          }, [context])
        }
      }

      if (Object.prototype.hasOwnProperty.call(rootHooks, path)) {
        return rootHooks[path as never]
      }

      return edenTreatyReactQueryProxy[path as never]
    },
  })

  return edenTreatyReactQuery as any
}
