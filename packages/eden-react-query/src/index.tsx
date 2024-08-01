import {
  EdenClient,
  type EdenClientOptions,
  type EdenRequestOptions,
  type EdenRequestParams,
} from '@elysiajs/eden'
import type {
  CancelOptions,
  InfiniteData,
  InvalidateOptions,
  InvalidateQueryFilters,
  MutationOptions,
  QueryFilters,
  QueryKey,
  RefetchOptions,
  RefetchQueryFilters,
  ResetOptions,
  SetDataOptions,
  Updater,
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

import { createUtilityFunctions, type EdenProvider } from './context'
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
import type { EdenUseMutationOptions, EdenUseMutationResult } from './use-mutation'
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

const asyncIteratorsSupported = typeof Symbol === 'function' && !!Symbol.asyncIterator

/**
 * Check that value is object
 * @internal
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && !Array.isArray(value) && typeof value === 'object'
}

export function isAsyncIterable<TValue>(value: unknown): value is AsyncIterable<TValue> {
  return asyncIteratorsSupported && isObject(value) && Symbol.asyncIterator in value
}

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
  TRouter extends AnyElysia,
  TSSRContext,
> = TRPCContextPropsBase<TRouter, TSSRContext> & {
  client: CreateTRPCClient<TRouter>
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

export type CreateEdenQueryOptions<T extends AnyElysia = AnyElysia> =
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

export type CreateClient<T extends AnyElysia = AnyElysia> = (
  options: EdenClientOptions<T>,
) => EdenClient<T>

/**
 * @internal
 */
export function createRootHooks<
  TElysia extends AnyElysia,
  TSSRContext = unknown,
  TError = EdenClientErrorLike<TElysia>,
>(config?: CreateEdenQueryOptions<TElysia>) {
  const mutationSuccessOverride: UseMutationOverride['onSuccess'] =
    config?.overrides?.useMutation?.onSuccess ?? ((options) => options.originalFn())

  type ProviderContext = TRPCContextState<TElysia, TSSRContext>

  const Context = (config?.context ?? TRPCContext) as React.Context<ProviderContext>

  const createClient: CreateClient<TElysia> = (opts) => {
    return new EdenClient(opts)
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
    opts: TOptions,
  ): TOptions {
    const { queryClient, ssrState } = useContext()

    return ssrState &&
      ssrState !== 'mounted' &&
      queryClient.getQueryCache().find({ queryKey })?.state.status === 'error'
      ? {
          retryOnMount: false,
          ...opts,
        }
      : opts
  }

  function useQuery(
    path: readonly string[],
    input: unknown,
    opts?: EdenUseQueryOptions<unknown, unknown, TError>,
  ): EdenUseQueryResult<unknown, TError> {
    const context = useContext()

    const { abortOnUnmount, client, ssrState, queryClient, prefetchQuery } = context

    const queryKey = getQueryKey([...path], input as any, 'query')

    const defaultOpts = queryClient.getQueryDefaults(queryKey)

    const isInputSkipToken = input === skipToken

    if (
      typeof window === 'undefined' &&
      ssrState === 'prepass' &&
      opts?.eden?.ssr !== false &&
      (opts?.enabled ?? defaultOpts?.enabled) !== false &&
      !isInputSkipToken &&
      !queryClient.getQueryCache().find({ queryKey })
    ) {
      void prefetchQuery(queryKey, opts as any)
    }
    const ssrOpts = useSSRQueryOptionsIfNeeded(queryKey, {
      ...defaultOpts,
      ...opts,
    })

    const shouldAbortOnUnmount =
      opts?.eden?.abortOnUnmount ?? config?.abortOnUnmount ?? abortOnUnmount

    const hook = __useQuery(
      {
        ...ssrOpts,
        queryKey: queryKey as any,
        queryFn: isInputSkipToken
          ? input
          : async (queryFunctionContext) => {
              const actualOpts = {
                ...ssrOpts,
                eden: {
                  ...ssrOpts?.eden,
                  ...(shouldAbortOnUnmount
                    ? { signal: queryFunctionContext.signal }
                    : { signal: null }),
                },
              }

              const result = await client.query(...getClientArgs(queryKey, actualOpts))

              if (isAsyncIterable(result)) {
                const queryCache = queryClient.getQueryCache()

                const query = queryCache.build(queryFunctionContext.queryKey, {
                  queryKey,
                })

                query.setState({
                  data: [],
                  status: 'success',
                })

                const aggregate: unknown[] = []
                for await (const value of result) {
                  aggregate.push(value)

                  query.setState({
                    data: [...aggregate],
                  })
                }
                return aggregate
              }
              return result
            },
      },
      queryClient,
    ) as EdenUseQueryResult<unknown, TError>

    hook.eden = useHookResult({ path })

    return hook
  }

  function useSuspenseQuery(
    path: readonly string[],
    input: unknown,
    opts?: EdenUseSuspenseQueryOptions<unknown, unknown, TError>,
  ): EdenUseSuspenseQueryResult<unknown, TError> {
    const context = useContext()

    const queryKey = getQueryKey([...path], input as any, 'query')

    const shouldAbortOnUnmount =
      opts?.eden?.abortOnUnmount ?? config?.abortOnUnmount ?? context.abortOnUnmount

    const hook = __useSuspenseQuery(
      {
        ...opts,
        queryKey: queryKey as any,
        queryFn: (queryFunctionContext) => {
          const actualOpts = {
            trpc: {
              ...(shouldAbortOnUnmount
                ? { signal: queryFunctionContext.signal }
                : { signal: null }),
            },
          }

          return context.client.query(...getClientArgs(queryKey, actualOpts))
        },
      },
      context.queryClient,
    ) as EdenUseQueryResult<unknown, TError>

    hook.eden = useHookResult({ path })

    return [hook.data, hook as any]
  }

  function useMutation(
    path: readonly string[],
    opts?: EdenUseMutationOptions<unknown, TError, unknown, unknown>,
  ): EdenUseMutationResult<unknown, TError, unknown, unknown> {
    const { client } = useContext()

    const queryClient = useQueryClient()

    const mutationKey = getMutationKey(path)

    const defaultOpts = queryClient.defaultMutationOptions(
      queryClient.getMutationDefaults(mutationKey),
    )

    const hook = __useMutation(
      {
        ...opts,
        mutationKey: mutationKey,
        mutationFn: (input) => {
          return client.mutation(...getClientArgs([path, { input }], opts))
        },
        onSuccess(...args) {
          const originalFn = () => opts?.onSuccess?.(...args) ?? defaultOpts?.onSuccess?.(...args)

          return mutationSuccessOverride({
            originalFn,
            queryClient,
            meta: opts?.meta ?? defaultOpts?.meta ?? {},
          })
        },
      },
      queryClient,
    ) as EdenUseMutationResult<unknown, TError, unknown, unknown>

    hook.eden = useHookResult({ path })

    return hook
  }

  /* istanbul ignore next -- @preserve */
  function useSubscription(
    path: readonly string[],
    input: unknown,
    opts: EdenUseSubscriptionOptions<unknown, TError>,
  ) {
    const enabled = opts?.enabled ?? input !== skipToken

    const queryKey = hashKey(getQueryKey([...path], input as any, 'any'))

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
    path: readonly string[],
    input: unknown,
    opts: EdenUseInfiniteQueryOptions<unknown, unknown, TError>,
  ): EdenUseInfiniteQueryResult<unknown, TError, unknown> {
    const { client, ssrState, prefetchInfiniteQuery, queryClient, abortOnUnmount } = useContext()

    const queryKey = getQueryKey([...path], input as any, 'infinite')

    const defaultOpts = queryClient.getQueryDefaults(queryKey)

    const isInputSkipToken = input === skipToken

    if (
      typeof window === 'undefined' &&
      ssrState === 'prepass' &&
      opts?.eden?.ssr !== false &&
      (opts?.enabled ?? defaultOpts?.enabled) !== false &&
      !isInputSkipToken &&
      !queryClient.getQueryCache().find({ queryKey })
    ) {
      void prefetchInfiniteQuery(queryKey, { ...defaultOpts, ...opts } as any)
    }

    const ssrOpts = useSSRQueryOptionsIfNeeded(queryKey, { ...defaultOpts, ...opts })

    // request option should take priority over global
    const shouldAbortOnUnmount = opts?.eden?.abortOnUnmount ?? abortOnUnmount

    const hook = __useInfiniteQuery(
      {
        ...ssrOpts,
        initialPageParam: opts.initialCursor ?? null,
        persister: opts.persister,
        queryKey: queryKey as any,
        queryFn: isInputSkipToken
          ? input
          : (queryFunctionContext) => {
              const actualOpts = {
                ...ssrOpts,
                trpc: {
                  ...ssrOpts?.eden,
                  ...(shouldAbortOnUnmount
                    ? { signal: queryFunctionContext.signal }
                    : { signal: null }),
                },
              }

              return client.query(
                ...getClientArgs(queryKey, actualOpts, {
                  pageParam: queryFunctionContext.pageParam ?? opts.initialCursor,
                  direction: queryFunctionContext.direction,
                }),
              )
            },
      },
      queryClient,
    ) as EdenUseInfiniteQueryResult<unknown, TError, unknown>

    hook.eden = useHookResult({ path })

    return hook
  }

  function useSuspenseInfiniteQuery(
    path: readonly string[],
    input: unknown,
    opts: EdenUseSuspenseInfiniteQueryOptions<unknown, unknown, TError>,
  ): EdenUseSuspenseInfiniteQueryResult<unknown, TError, unknown> {
    const context = useContext()

    const queryKey = getQueryKey([...path], input as any, 'infinite')

    const defaultOpts = context.queryClient.getQueryDefaults(queryKey)

    const ssrOpts = useSSRQueryOptionsIfNeeded(queryKey, { ...defaultOpts, ...opts })

    // request option should take priority over global
    const shouldAbortOnUnmount = opts?.eden?.abortOnUnmount ?? context.abortOnUnmount

    const hook = __useSuspenseInfiniteQuery(
      {
        ...opts,
        initialPageParam: opts.initialCursor ?? null,
        queryKey,
        queryFn: (queryFunctionContext) => {
          const actualOpts = {
            ...ssrOpts,
            eden: {
              ...ssrOpts?.eden,
              ...(shouldAbortOnUnmount ? { signal: queryFunctionContext.signal } : {}),
            },
          }

          return context.client.query(
            ...getClientArgs(queryKey, actualOpts, {
              pageParam: queryFunctionContext.pageParam ?? opts.initialCursor,
              direction: queryFunctionContext.direction,
            }),
          )
        },
      },
      context.queryClient,
    ) as EdenUseInfiniteQueryResult<unknown, TError, unknown>

    hook.eden = useHookResult({ path })

    return [hook.data, hook] as any
  }

  const useQueries: EdenUseQueries<TElysia> = (queriesCallback) => {
    const { ssrState, queryClient, prefetchQuery, client } = useContext()

    const proxy = createUseQueriesProxy(client)

    const queries: readonly EdenQueryOptions<any, any>[] = queriesCallback(proxy)

    if (typeof window === 'undefined' && ssrState === 'prepass') {
      for (const query of queries) {
        const queryOption = query as EdenQueryOptions<any, any>

        if (
          queryOption.eden?.ssr !== false &&
          !queryClient.getQueryCache().find({ queryKey: queryOption.queryKey })
        ) {
          void prefetchQuery(queryOption.queryKey, queryOption as any)
        }
      }
    }

    return __useQueries({ queries }, queryClient)
  }

  const useSuspenseQueries: EdenUseSuspenseQueries<TElysia> = (queriesCallback) => {
    const { queryClient, client } = useContext()

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
 * Infer the type of a `createReactQueryHooks` function
 * @internal
 */
export type CreateReactQueryHooks<TElysia extends AnyElysia, TSSRContext = unknown> = ReturnType<
  typeof createRootHooks<TElysia, TSSRContext>
>
