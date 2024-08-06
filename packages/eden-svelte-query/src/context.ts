import type { EdenClient, EdenClientError } from '@elysiajs/eden'
import type {
  CancelOptions,
  InfiniteData,
  InvalidateOptions,
  InvalidateQueryFilters,
  MutationOptions,
  QueryClient,
  QueryFilters,
  QueryKey,
  RefetchOptions,
  RefetchQueryFilters,
  ResetOptions,
  SetDataOptions,
  Updater,
} from '@tanstack/svelte-query'
import type { AnyElysia } from 'elysia'

import type { EdenFetchInfiniteQueryOptions } from './integration/hooks/fetch-infinite'
import type { EdenFetchQueryOptions } from './integration/hooks/fetch-query'
import type { EdenMutationKey, EdenQueryKey, EdenQueryType } from './integration/internal/query-key'

export const EDEN_CONTEXT_KEY = Symbol('EDEN_CONTEXT')

export type EdenContextPropsBase<TElysia extends AnyElysia, _TSSRContext = unknown> = {
  /**
   * The `TRPCClient`
   */
  client: EdenClient<TElysia>

  /**
   * @deprecated pass abortOnUnmount to `createTRPCReact` instead
   * Abort loading query calls when unmounting a component - usually when navigating to a new page
   * @default false
   */
  abortOnUnmount?: boolean
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

export const contextProps: (keyof EdenContextPropsBase<any, any>)[] = ['client', 'abortOnUnmount']

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
