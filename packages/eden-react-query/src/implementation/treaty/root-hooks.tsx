import type { EdenClientError, EdenCreateClient, EdenRequestParams } from '@elysiajs/eden'
import { EdenClient } from '@elysiajs/eden'
import type {
  QueryClient,
  QueryKey,
  QueryObserverOptions,
  UndefinedInitialDataInfiniteOptions,
  UseMutationOptions,
  UseSuspenseInfiniteQueryOptions,
} from '@tanstack/react-query'
import {
  hashKey,
  skipToken,
  useInfiniteQuery as __useInfiniteQuery,
  useQueries as __useQueries,
  useQuery as __useQuery,
  useQueryClient,
  useSuspenseInfiniteQuery as __useSuspenseInfiniteQuery,
  useSuspenseQueries as __useSuspenseQueries,
  useSuspenseQuery as __useSuspenseQuery,
} from '@tanstack/react-query'
import type { AnyElysia } from 'elysia'
import * as React from 'react'

import type { EdenContextProps, EdenContextState, EdenProvider, SSRState } from '../../context'
import { createUtilityFunctions, EdenQueryContext } from '../../context'
import type {
  EdenUseInfiniteQueryOptions,
  EdenUseInfiniteQueryResult,
} from '../../integration/hooks/use-infinite-query'
import type {
  EdenUseMutationOptions,
  EdenUseMutationResult,
  EdenUseMutationVariables,
} from '../../integration/hooks/use-mutation'
import { useEdenMutation } from '../../integration/hooks/use-mutation'
import type { EdenUseQueryOptions, EdenUseQueryResult } from '../../integration/hooks/use-query'
import type { EdenUseSubscriptionOptions } from '../../integration/hooks/use-subscription'
import type {
  EdenUseSuspenseInfiniteQueryOptions,
  EdenUseSuspenseInfiniteQueryResult,
} from '../../integration/hooks/use-suspense-infinite-query'
import type {
  EdenUseSuspenseQueryOptions,
  EdenUseSuspenseQueryResult,
} from '../../integration/hooks/use-suspense-query'
import { parsePathsAndMethod } from '../../integration/internal/helpers'
import { appendEdenQueryExtension } from '../../integration/internal/query-hook-extension'
import type { EdenQueryKey } from '../../integration/internal/query-key'
import { getMutationKey, getQueryKey } from '../../integration/internal/query-key'
import type { EdenQueryRequestOptions } from '../../integration/internal/query-request-options'
import { isAsyncIterable } from '../../utils/is-async-iterable'

export type CreateEdenTreatyQueryRootHooksConfig<T extends AnyElysia = AnyElysia> =
  EdenQueryRequestOptions<T> & {
    /**
     * Override the default context provider
     * @default undefined
     */
    context?: React.Context<any>
  }

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

export function createEdenTreatyQueryRootHooks<
  TElysia extends AnyElysia,
  TSSRContext = unknown,
  TError = EdenClientError<TElysia>,
>(config?: CreateEdenTreatyQueryRootHooksConfig<TElysia>) {
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

  const useContext = () => {
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
  const useSSRQueryOptionsIfNeeded = <TOptions extends { retryOnMount?: boolean } | undefined>(
    queryKey: EdenQueryKey,
    options: TOptions,
  ): TOptions => {
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

  const useQuery = (
    originalPaths: readonly string[],
    input: any,
    options?: EdenUseQueryOptions<unknown, unknown, TError>,
  ): EdenUseQueryResult<unknown, TError> => {
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

    if (isInputSkipToken) {
      resolvedQueryOptions.queryFn = input
    } else {
      const options = input

      resolvedQueryOptions.queryFn = async (queryFunctionContext) => {
        const params: EdenRequestParams = {
          ...config,
          ...eden,
          options,
          path,
          method,
          fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
        }

        const shouldForwardSignal = eden?.abortOnUnmount ?? config?.abortOnUnmount ?? abortOnUnmount

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

    appendEdenQueryExtension(hook, { path: paths })

    return hook
  }

  function useSuspenseQuery(
    originalPaths: readonly string[],
    input: any,
    options?: EdenUseSuspenseQueryOptions<unknown, unknown, TError>,
  ): EdenUseSuspenseQueryResult<unknown, TError> {
    const context = useContext()

    const { queryClient, abortOnUnmount } = context

    const { paths, path, method } = parsePathsAndMethod(originalPaths)

    const queryKey = getQueryKey(paths, input, 'query')

    const defaultOptions = queryClient.getQueryDefaults(queryKey)

    const isInputSkipToken = input === skipToken

    const { eden, ...queryOptions } = options ?? {}

    const shouldAbortOnUnmount = eden?.abortOnUnmount ?? config?.abortOnUnmount ?? abortOnUnmount

    const resolvedQueryOptions = { ...defaultOptions, ...queryOptions, queryKey }

    if (isInputSkipToken) {
      resolvedQueryOptions.queryFn = input
    } else {
      const options = input

      resolvedQueryOptions.queryFn = async (queryFunctionContext) => {
        const params: EdenRequestParams = {
          ...config,
          ...eden,
          options,
          path,
          method,
          fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
        }

        if (shouldAbortOnUnmount) {
          params.fetch = { ...params.fetch, signal: queryFunctionContext.signal }
        }

        const result = await context.client.query(params)

        if (result.error != null) {
          throw result.error
        }

        return result.data
      }
    }

    type HookResult = EdenUseQueryResult<any, TError>

    const hook = __useSuspenseQuery(resolvedQueryOptions, queryClient) as HookResult

    appendEdenQueryExtension(hook, { path: paths })

    return [hook.data, hook as any]
  }

  function useMutation(
    originalPaths: readonly string[],
    options?: EdenUseMutationOptions<unknown, TError, unknown, unknown>,
  ): EdenUseMutationResult<unknown, TError, unknown, unknown, unknown> {
    const context = useContext()

    const { client } = context

    const queryClient = useQueryClient()

    const { paths, path, method } = parsePathsAndMethod(originalPaths)

    const mutationKey = getMutationKey(paths)

    const mutationDefaults = queryClient.getMutationDefaults(mutationKey)

    const defaultOptions = queryClient.defaultMutationOptions(mutationDefaults)

    const mutationOptions: UseMutationOptions<unknown, TError, unknown, unknown> = {
      ...options,
      mutationKey: mutationKey,
      mutationFn: async (variables: any = {}) => {
        const { body, options } = variables as EdenUseMutationVariables

        const params: EdenRequestParams = {
          ...config,
          options,
          body,
          path,
          method,
        }

        const result = await client.query(params)

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

    type HookResult = EdenUseMutationResult<any, any, any, any, any>

    const hook = useEdenMutation(mutationOptions, queryClient) as HookResult

    appendEdenQueryExtension(hook, { path: paths })

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
    const context = useContext()

    const { client, ssrState, prefetchInfiniteQuery, queryClient, abortOnUnmount } = context

    const { paths, path, method } = parsePathsAndMethod(originalPaths)

    const queryKey = getQueryKey(path, input, 'infinite')

    const defaultOptions = queryClient.getQueryDefaults(queryKey)

    const initialQueryOptions = { ...defaultOptions, ...options }

    const isInputSkipToken = input === skipToken

    if (isServerQuery(ssrState, options, defaultOptions, isInputSkipToken, queryClient, queryKey)) {
      void prefetchInfiniteQuery(queryKey, initialQueryOptions as any)
    }

    const { eden, ...ssrQueryOptions } = useSSRQueryOptionsIfNeeded(queryKey, initialQueryOptions)

    type InfiniteQueryOptions = UndefinedInitialDataInfiniteOptions<
      unknown,
      TError,
      unknown,
      any,
      unknown
    >

    const queryOptions = {
      ...ssrQueryOptions,
      initialPageParam: ssrQueryOptions.initialCursor ?? null,
      queryKey,
    } as InfiniteQueryOptions

    if (isInputSkipToken) {
      queryOptions.queryFn = input
    } else {
      queryOptions.queryFn = async (queryFunctionContext) => {
        const options = { ...input }

        const params = {
          ...config,
          ...eden,
          options,
          path,
          method,
          fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
        }

        const shouldForwardSignal = eden?.abortOnUnmount ?? config?.abortOnUnmount ?? abortOnUnmount

        if (shouldForwardSignal) {
          params.fetch = { ...params.fetch, signal: queryFunctionContext.signal }
        }

        // FIXME: scuffed way to set cursor. Not sure how to tell if the cursor will be
        // in the route params or query.
        // e.g. /api/pages/:cursor -> /api/pages/1 or /api/pages?cursor=1

        if (queryFunctionContext.pageParam != null) {
          if (params.options.query) {
            ;(params.options.query as any)['cursor'] = queryFunctionContext.pageParam
          } else if (params.options.params) {
            ;(params.options.params as any)['cursor'] = queryFunctionContext.pageParam
          }
        }

        const result = await client.query(params)

        if (result.error != null) {
          throw result.error
        }

        return result.data
      }
    }

    type HookResult = EdenUseInfiniteQueryResult<unknown, TError, unknown>

    const hook = __useInfiniteQuery(queryOptions, queryClient) as HookResult

    appendEdenQueryExtension(hook, { path: paths })

    return hook
  }

  function useSuspenseInfiniteQuery(
    originalPaths: readonly string[],
    input: any,
    options: EdenUseSuspenseInfiniteQueryOptions<unknown, unknown, TError>,
  ): EdenUseSuspenseInfiniteQueryResult<unknown, TError, unknown> {
    const context = useContext()

    const { queryClient, abortOnUnmount } = context

    const { paths, path, method } = parsePathsAndMethod(originalPaths)

    const queryKey = getQueryKey(path, input, 'infinite')

    const defaultOptions = queryClient.getQueryDefaults(queryKey)

    const initialQueryOptions = { ...defaultOptions, ...options }

    const { eden, ...ssrQueryOptions } = useSSRQueryOptionsIfNeeded(queryKey, initialQueryOptions)

    const queryOptions = {
      ...ssrQueryOptions,
      initialPageParam: options.initialCursor ?? null,
      queryKey,
      queryFn: async (queryFunctionContext) => {
        const options = { ...input }

        const params = {
          ...config,
          ...eden,
          options,
          path,
          method,
          fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
        }

        const shouldForwardSignal = eden?.abortOnUnmount ?? config?.abortOnUnmount ?? abortOnUnmount

        if (shouldForwardSignal) {
          params.fetch = { ...params.fetch, signal: queryFunctionContext.signal }
        }

        // FIXME: scuffed way to set cursor. Not sure how to tell if the cursor will be
        // in the route params or query.
        // e.g. /api/pages/:cursor -> /api/pages/1 or /api/pages?cursor=1

        if (queryFunctionContext.pageParam != null) {
          if (params.options.query) {
            ;(params.options.query as any)['cursor'] = queryFunctionContext.pageParam
          } else if (params.options.params) {
            ;(params.options.params as any)['cursor'] = queryFunctionContext.pageParam
          }
        }

        const result = await context.client.query(params)

        if (result.error != null) {
          throw result.error
        }

        return result.data
      },
    } as UseSuspenseInfiniteQueryOptions

    type HookResult = EdenUseInfiniteQueryResult<unknown, TError, unknown>

    const hook = __useSuspenseInfiniteQuery(queryOptions, context.queryClient) as HookResult

    appendEdenQueryExtension(hook, { path: paths })

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
