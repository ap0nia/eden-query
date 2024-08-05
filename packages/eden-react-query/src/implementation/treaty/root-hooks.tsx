import {
  EdenClient,
  type EdenClientError,
  type EdenCreateClient,
  type EdenRequestParams,
} from '@elysiajs/eden'
import { skipToken } from '@tanstack/react-query'
import type { AnyElysia } from 'elysia'
import * as React from 'react'

import {
  createUtilityFunctions,
  type EdenContextProps,
  type EdenContextState,
  type EdenProvider,
  EdenQueryContext,
  type SSRState,
} from '../../context'
import type { EdenUseQueryOptions, EdenUseQueryResult } from '../../integration/hooks/use-query'
import { parsePathsAndMethod } from '../../integration/internal/helpers'
import { type EdenQueryKey, getQueryKey } from '../../integration/internal/query-key'
import { isAsyncIterable } from '../../utils/is-async-iterable'

export function createEdenTreatyQueryRootHooks<
  TElysia extends AnyElysia,
  TSSRContext = unknown,
  TError = EdenClientError<TElysia>,
>(config?: CreateEdenReactQueryOptions<TElysia>) {
  type ProviderContext = EdenContextState<TElysia, TSSRContext>

  const Context = (config?.context ?? EdenQueryContext) as React.Context<ProviderContext>

  const createClient: EdenCreateClient<TElysia> = (options) => {
    return new EdenClient(options)
  }

  const createContext = (props: EdenContextProps<TElysia, TSSRContext>) => {
    const {
      abortOnUnmount = false,
      client,
      queryClient,
      ssrContext = null,
      ssrState = false,
    } = props

    const utilityFunctions = createUtilityFunctions({ client, queryClient })

    return {
      abortOnUnmount,
      queryClient,
      client,
      ssrContext,
      ssrState,
      ...utilityFunctions,
    }
  }

  const EdenProvider: EdenProvider<TElysia, TSSRContext> = (props) => {
    const { abortOnUnmount = false, client, queryClient, ssrContext, children } = props

    const [ssrState, setSSRState] = React.useState<SSRState>(props.ssrState ?? false)

    const contextValue = React.useMemo<ProviderContext>(() => {
      return createContext({ abortOnUnmount, client, queryClient, ssrContext, ssrState })
    }, [abortOnUnmount, client, queryClient, ssrContext, ssrState])

    React.useEffect(() => {
      // Only updating state to `mounted` if we are using SSR.
      // This makes it so we don't have an unnecessary re-render when opting out of SSR.
      setSSRState((state) => (state ? 'mounted' : false))
    }, [])

    return <Context.Provider value={contextValue}>{children}</Context.Provider>
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
    const context = useContext()

    const { abortOnUnmount, client, ssrState, queryClient, prefetchQuery } = context

    const { paths, path, method } = parsePathsAndMethod(originalPaths)

    const queryKey = getQueryKey(paths, input, 'query')

    const defaultOptions = queryClient.getQueryDefaults(queryKey)

    const isInputSkipToken = input === skipToken

    if (isServerQuery(ssrState, options, defaultOptions, isInputSkipToken, queryClient, queryKey)) {
      void prefetchQuery(queryKey, options)
    }

    const initialQueryOptions = { ...defaultOptions, ...options }

    const { eden, ...queryOptions } = useSSRQueryOptionsIfNeeded(queryKey, initialQueryOptions)

    const resolvedQueryOptions = { ...queryOptions, queryKey }

    const shouldForwardSignal = eden?.abortOnUnmount ?? config?.abortOnUnmount ?? abortOnUnmount

    if (isInputSkipToken) {
      resolvedQueryOptions.queryFn = input
    } else {
      const options = input

      resolvedQueryOptions.queryFn = async (queryFunctionContext) => {
        const params: EdenRequestParams = {
          ...config,
          ...eden,
          options,
          method,
          path,
          fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
        }

        if (shouldForwardSignal) {
          params.fetch = { ...params.fetch, signal: queryFunctionContext.signal }
        }

        const result = await client.query(params)

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

    const methodIsHttpMethod = isHttpMethod(method)

    if (methodIsHttpMethod) {
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
      /**
       * "options" property refers to input options like "query", "headers", "params".
       * @todo: maybe rename to "input" so it's less confusing.
       */
      options: input,
      path,
      fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
    }

    if (methodIsHttpMethod) {
      params.method = method
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

    const methodIsHttpMethod = isHttpMethod(method)
    if (methodIsHttpMethod) {
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

        if (methodIsHttpMethod) {
          resolvedParams.method = method
        }

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
        const onSuccess = options?.onSuccess ?? defaultOptions.onSuccess

        if (config?.overrides?.useMutation?.onSuccess == null) {
          return onSuccess?.(data, variables, context)
        }

        const meta: any = options?.meta ?? defaultOptions.meta

        const originalFn = () => onSuccess?.(data, variables, context)

        return config.overrides.useMutation.onSuccess({ meta, originalFn, queryClient })
      },
    }

    type HookResult = EdenUseMutationResult<unknown, TError, unknown, unknown>

    const hook = useEdenMutation(mutationOptions, queryClient) as HookResult

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
      options: input,
      path,
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
        const resolvedParams = { ...params, options: { ...input } }

        if (shouldAbortOnUnmount) {
          resolvedParams.fetch = { ...resolvedParams.fetch }
          resolvedParams.fetch.signal = queryFunctionContext.signal
        }

        // FIXME: scuffed way to set cursor. Not sure how to tell if the cursor will be
        // in the route params or query.
        // e.g. /api/pages/:cursor -> /api/pages/1 or /api/pages?cursor=1

        if (queryFunctionContext.pageParam != null) {
          if (resolvedParams.options.query) {
            ;(resolvedParams.options.query as any)['cursor'] = queryFunctionContext.pageParam
          } else if (resolvedParams.options.params) {
            ;(resolvedParams.options.params as any)['cursor'] = queryFunctionContext.pageParam
          }
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
      path,
      options: input,
      fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
    }

    const queryOptions = {
      ...ssrQueryOptions,
      initialPageParam: options.initialCursor ?? null,
      queryKey,
      queryFn: async (queryFunctionContext) => {
        const resolvedParams = { ...params, options: { ...input } }

        if (shouldAbortOnUnmount) {
          resolvedParams.fetch = { ...resolvedParams.fetch }
          resolvedParams.fetch.signal = queryFunctionContext.signal
        }

        // FIXME: scuffed way to set cursor. Not sure how to tell if the cursor will be
        // in the route params or query.
        // e.g. /api/pages/:cursor -> /api/pages/1 or /api/pages?cursor=1

        if (queryFunctionContext.pageParam != null) {
          if (resolvedParams.options.query) {
            ;(resolvedParams.options.query as any)['cursor'] = queryFunctionContext.pageParam
          } else if (resolvedParams.options.params) {
            ;(resolvedParams.options.params as any)['cursor'] = queryFunctionContext.pageParam
          }
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
    Provider: EdenProvider,
    createClient,
    useContext,
    useUtils: useContext,
    createContext,
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
