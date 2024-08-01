import { EdenClient } from '@elysiajs/eden'
import {
  type CancelOptions,
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

import type { EdenMutationKey, EdenQueryKey as EdenQueryKey } from './query-key'
import type { EdenFetchInfiniteQueryOptions } from './use-infinite-query'
import type { EdenFetchQueryOptions } from './use-query'

export interface CreateQueryUtilsOptions<T extends AnyElysia> {
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
export interface EdenQueryUtils<TRouter extends AnyElysia> {
  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientfetchquery
   */
  fetchQuery: (
    queryKey: EdenQueryKey,
    opts?: EdenFetchQueryOptions<unknown, TRPCClientError<TRouter>>,
  ) => Promise<unknown>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientfetchinfinitequery
   */
  fetchInfiniteQuery: (
    queryKey: EdenQueryKey,
    opts?: EdenFetchInfiniteQueryOptions<unknown, unknown, TRPCClientError<TRouter>>,
  ) => Promise<InfiniteData<unknown, unknown>>

  /**
   * @link https://tanstack.com/query/v5/docs/framework/react/guides/prefetching
   */
  prefetchQuery: (
    queryKey: EdenQueryKey,
    opts?: EdenFetchQueryOptions<unknown, TRPCClientError<TRouter>>,
  ) => Promise<void>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientprefetchinfinitequery
   */
  prefetchInfiniteQuery: (
    queryKey: EdenQueryKey,
    opts?: EdenFetchInfiniteQueryOptions<unknown, unknown, TRPCClientError<TRouter>>,
  ) => Promise<void>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientensurequerydata
   */
  ensureQueryData: (
    queryKey: EdenQueryKey,
    opts?: EdenFetchQueryOptions<unknown, TRPCClientError<TRouter>>,
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

export interface EdenContextProps<TRouter extends AnyElysia, TSSRContext>
  extends EdenContextPropsBase<TRouter, TSSRContext> {
  /**
   * The react-query `QueryClient`
   */
  queryClient: QueryClient
}

export interface EdenProviderProps<TRouter extends AnyElysia, TSSRContext>
  extends EdenContextProps<TRouter, TSSRContext> {
  children: React.ReactNode
}

export type EdenProvider<TRouter extends AnyElysia, TSSRContext> = (
  props: EdenProviderProps<TRouter, TSSRContext>,
) => JSX.Element

/**
 * Creates a set of utility functions that can be used to interact with `react-query`
 * @param opts the `TRPCClient` and `QueryClient` to use
 * @returns a set of utility functions that can be used to interact with `react-query`
 * @internal
 */
export function createUtilityFunctions<T extends AnyElysia>(
  opts: CreateQueryUtilsOptions<T>,
): EdenQueryUtils<T> {
  const { client, queryClient } = opts

  return {
    fetchQuery: (queryKey, opts) => {
      return queryClient.fetchQuery({
        ...opts,
        queryKey,
        queryFn: () => client.query(...getClientArgs(queryKey, opts)),
      })
    },

    fetchInfiniteQuery: (queryKey, opts) => {
      return queryClient.fetchInfiniteQuery({
        ...opts,
        queryKey,
        queryFn: ({ pageParam, direction }) => {
          return client.query(...getClientArgs(queryKey, opts, { pageParam, direction }))
        },
        initialPageParam: opts?.initialCursor ?? null,
      })
    },

    prefetchQuery: (queryKey, opts) => {
      return queryClient.prefetchQuery({
        ...opts,
        queryKey,
        queryFn: () => client.query(...getClientArgs(queryKey, opts)),
      })
    },

    prefetchInfiniteQuery: (queryKey, opts) => {
      return queryClient.prefetchInfiniteQuery({
        ...opts,
        queryKey,
        queryFn: ({ pageParam, direction }) => {
          return client.query(...getClientArgs(queryKey, opts, { pageParam, direction }))
        },
        initialPageParam: opts?.initialCursor ?? null,
      })
    },

    ensureQueryData: (queryKey, opts) => {
      return queryClient.ensureQueryData({
        ...opts,
        queryKey,
        queryFn: () => client.query(...getClientArgs(queryKey, opts)),
      })
    },

    invalidateQueries: (queryKey, filters, options) => {
      return queryClient.invalidateQueries({ ...filters, queryKey }, options)
    },
    resetQueries: (queryKey, filters, options) => {
      return queryClient.resetQueries({ ...filters, queryKey }, options)
    },

    refetchQueries: (queryKey, filters, options) => {
      return queryClient.refetchQueries({ ...filters, queryKey }, options)
    },

    cancelQuery: (queryKey, options) => {
      return queryClient.cancelQueries({ queryKey }, options)
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
      const path = mutationKey[0]

      const canonicalMutationFn = (input: unknown) => {
        return client.mutation(...getClientArgs([path, { input }], opts))
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
