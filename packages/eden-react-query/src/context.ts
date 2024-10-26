import {
  EdenClient,
  type EdenClientError as EdenClientError,
  type EdenRequestParams,
  parsePathsAndMethod,
} from '@ap0nia/eden'
import {
  type CancelOptions,
  type FetchQueryOptions,
  type InfiniteData,
  type InvalidateOptions,
  type InvalidateQueryFilters,
  type MutationOptions,
  QueryClient,
  type QueryFilters,
  type QueryKey,
  type RefetchOptions,
  type RefetchQueryFilters,
  type ResetOptions,
  type SetDataOptions,
  type Updater,
} from '@tanstack/react-query'
import type { AnyElysia } from 'elysia'
import * as React from 'react'

import type { EdenQueryConfig } from './config'
import type { EdenFetchInfiniteQueryOptions } from './integration/hooks/fetch-infinite'
import type { EdenFetchQueryOptions } from './integration/hooks/fetch-query'
import type { EdenMutationKey, EdenQueryKey, EdenQueryType } from './integration/internal/query-key'

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

export type SSRState = 'mounted' | 'mounting' | 'prepass' | false

export type EdenContextPropsBase<TElysia extends AnyElysia, TSSRContext> = {
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

export type EdenProviderProps<TRouter extends AnyElysia, TSSRContext> = EdenContextProps<
  TRouter,
  TSSRContext
> & {
  children: React.ReactNode
}

export type EdenProvider<TRouter extends AnyElysia, TSSRContext> = (
  props: EdenProviderProps<TRouter, TSSRContext>,
) => JSX.Element

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

export const contextProps: (keyof EdenContextPropsBase<any, any>)[] = [
  'client',
  'ssrContext',
  'ssrState',
  'abortOnUnmount',
]

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

/**
 * Creates a set of utility functions that can be used to interact with `react-query`
 * @param options the `TRPCClient` and `QueryClient` to use
 * @returns a set of utility functions that can be used to interact with `react-query`
 * @internal
 */
export function createUtilityFunctions<T extends AnyElysia>(
  options: EdenContextProps<T, any>,
  config?: EdenQueryConfig,
): EdenQueryUtils<T> {
  const { client, queryClient } = options

  return {
    fetchQuery: async (queryKey, options = {}) => {
      const { path, method } = parsePathsAndMethod(queryKey[0])

      const { eden, ...queryOptions } = options

      const edenQueryOptions: FetchQueryOptions<unknown, any, unknown, QueryKey, never> = {
        ...queryOptions,
        queryKey,
        queryFn: async (queryFunctionContext) => {
          let options: any = queryKey[1]?.input

          const params = {
            ...config,
            ...eden,
            options,
            path,
            method,
            fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
          } satisfies EdenRequestParams

          const shouldForwardSignal = eden?.abortOnUnmount ?? config?.abortOnUnmount

          if (shouldForwardSignal) {
            params.fetch = { ...params.fetch, signal: queryFunctionContext.signal }
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

    fetchInfiniteQuery: async (queryKey, options = {}) => {
      const { path, method } = parsePathsAndMethod(queryKey[0])

      const { eden, ...queryOptions } = options

      return await queryClient.fetchInfiniteQuery({
        ...queryOptions,
        queryKey,
        queryFn: async (context) => {
          const options: any = { ...(queryKey[1]?.input ?? {}) }

          const params = {
            ...config,
            ...eden,
            options,
            path,
            method,
            fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
          } satisfies EdenRequestParams

          if (context.pageParam != null) {
            if (params.options.query != null) {
              ;(params.options.query as any)['cursor'] = context.pageParam
              ;(params.options.query as any)['direction'] = context.direction
            }

            if (params.options.params != null) {
              ;(params.options.params as any)['cursor'] = context.pageParam
              ;(params.options.params as any)['direction'] = context.direction
            }
          }

          const result = await client.query(params)

          if (result.error != null) {
            throw result.error
          }

          return result.data
        },
        initialPageParam: options?.initialCursor ?? null,
      })
    },

    prefetchQuery: async (queryKey, options = {}) => {
      const { path, method } = parsePathsAndMethod(queryKey[0])

      const { eden, ...queryOptions } = options

      return await queryClient.prefetchQuery({
        ...queryOptions,
        queryKey,
        queryFn: async () => {
          const options: any = { ...(queryKey[1]?.input ?? {}) }

          const params = {
            ...config,
            ...eden,
            options,
            path,
            method,
            fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
          } satisfies EdenRequestParams

          const result = await client.query(params)

          if (result.error != null) {
            throw result.error
          }

          return result.data
        },
      })
    },

    prefetchInfiniteQuery: async (queryKey, options = {}) => {
      const { path, method } = parsePathsAndMethod(queryKey[0])

      const { eden, ...queryOptions } = options

      return await queryClient.prefetchInfiniteQuery({
        ...queryOptions,
        queryKey,
        queryFn: async (queryFunctionContext) => {
          const options: any = { ...(queryKey[1]?.input ?? {}) }

          const params = {
            ...config,
            ...eden,
            options,
            path,
            method,
            fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
          } satisfies EdenRequestParams

          if (queryFunctionContext.pageParam != null) {
            if (params.options.query != null) {
              ;(params.options.query as any)['cursor'] = queryFunctionContext.pageParam
              ;(params.options.query as any)['direction'] = queryFunctionContext.direction
            }

            if (params.options.params != null) {
              ;(params.options.params as any)['cursor'] = queryFunctionContext.pageParam
              ;(params.options.params as any)['direction'] = queryFunctionContext.direction
            }
          }

          const result = await client.query(params)

          if (result.error != null) {
            throw result.error
          }

          return result.data
        },
        initialPageParam: options?.initialCursor ?? null,
      })
    },

    ensureQueryData: async (queryKey, options = {}) => {
      const { path, method } = parsePathsAndMethod(queryKey[0])

      const { eden, ...queryOptions } = options

      return await queryClient.ensureQueryData({
        ...queryOptions,
        queryKey,
        queryFn: async () => {
          let options: any = queryKey[1]?.input

          const params = {
            ...config,
            ...eden,
            options,
            path,
            method,
            fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
          } satisfies EdenRequestParams

          const result = await client.query(params)

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

/**
 * Hack to make sure errors return `status`='error` when doing SSR
 * @link https://github.com/trpc/trpc/pull/1645
 */
export function useSSRQueryOptionsIfNeeded<TOptions extends { retryOnMount?: boolean } | undefined>(
  queryKey: EdenQueryKey,
  options: TOptions,
  context: EdenContextState<any, any>,
): TOptions {
  const { queryClient, ssrState } = context

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
