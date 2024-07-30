/**
 * All properties available to the eden-treaty proxy at the base.
 */

import type {
  EdenClient,
  EdenRequestOptions,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
} from '@elysiajs/eden'
import type {
  CancelOptions,
  FetchInfiniteQueryOptions,
  FetchQueryOptions,
  InfiniteData,
  InvalidateOptions,
  InvalidateQueryFilters,
  Query,
  QueryClient,
  QueryFilters,
  QueryKey,
  RefetchOptions,
  RefetchQueryFilters,
  ResetOptions,
  SetDataOptions,
  Updater,
} from '@tanstack/svelte-query'
import type { AnyElysia, RouteSchema } from 'elysia'

import type { EdenQueryKey, ExtractCursorType } from '../query'
import type { DeepPartial, DistributiveOmit, ProtectedIntersection } from '../utils/types'

/**
 * TODO
 */
type EdenTreatyGetContext<T> = T

/**
 * TODO
 */
type EdenTreatySetContext<T> = T

/**
 * TODO
 */
type EdenTreatyCreateQueries<T> = T

/**
 * Properties at the root of the eden treaty svelte-query proxy.
 */
export type EdenTreatyBase<T extends AnyElysia> = {
  /**
   * Get utilities from context. Only use within Svelte components.
   */
  getContext: EdenTreatyGetContext<T>

  /**
   * Create utilities and set the context. Only use within Svelte components.
   */
  setContext: EdenTreatySetContext<T>

  /**
   * Create utilities without setting the context. Can be used outside of Svelte components,
   * e.g. load functions.
   */
  createContext: EdenTreatyCreateContext<T>

  /**
   */
  createQueries: EdenTreatyCreateQueries<T>
}

/**
 */
export type EdenContextProps<T extends AnyElysia> = {
  /**
   * The eden fetch client.
   */
  client: EdenClient<T>

  /**
   * The svelte-query {@link QueryClient}
   */
  queryClient: QueryClient
}

export type EdenTreatyCreateContext<T extends AnyElysia> = ProtectedIntersection<
  EdenContextProps<T>,
  EdenTreatyContext<T>
>

export type EdenTreatyContext<
  T extends AnyElysia,
  TSchema = T['_routes'],
> = EdenTreatyUniversalContext & {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? EdenTreatyRouteContext<TSchema[K]>
    : EdenTreatyContext<T, TSchema[K]>
}

export type EdenFetchQueryOptions<TOutput, TError> = DistributiveOmit<
  FetchQueryOptions<TOutput, TError>,
  'queryKey'
> &
  EdenRequestOptions

export type EdenFetchInfiniteQueryOptions<TInput, TOutput, TError> = DistributiveOmit<
  FetchInfiniteQueryOptions<TOutput, TError, TOutput, EdenQueryKey, ExtractCursorType<TInput>>,
  'queryKey' | 'initialPageParam'
> &
  EdenRequestOptions & {
    initialCursor?: ExtractCursorType<TInput>
  }

/**
 * Context (i.e. utilities) available for a specific route.
 */
export type EdenTreatyRouteContext<T extends RouteSchema> = {
  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientfetchquery
   */
  fetch(
    input: InferRouteOptions<T>,
    opts?: EdenFetchQueryOptions<InferRouteOutput<T>, InferRouteError<T>>,
  ): Promise<InferRouteOutput<T>>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientfetchinfinitequery
   */
  fetchInfinite(
    input: InferRouteOptions<T>,
    opts?: EdenFetchInfiniteQueryOptions<
      InferRouteOptions<T>,
      InferRouteOutput<T>,
      InferRouteError<T>
    >,
  ): Promise<
    InfiniteData<InferRouteOutput<T>, NonNullable<ExtractCursorType<InferRouteOptions<T>>> | null>
  >

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientprefetchquery
   */
  prefetch(
    input: InferRouteOptions<T>,
    opts?: EdenFetchQueryOptions<InferRouteOutput<T>, InferRouteError<T>>,
  ): Promise<void>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientprefetchinfinitequery
   */
  prefetchInfinite(
    input: InferRouteOptions<T>,
    opts?: EdenFetchInfiniteQueryOptions<
      InferRouteOptions<T>,
      InferRouteOutput<T>,
      InferRouteError<T>
    >,
  ): Promise<void>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientensurequerydata
   */
  ensureData(
    input: InferRouteOptions<T>,
    opts?: EdenFetchQueryOptions<InferRouteOutput<T>, InferRouteError<T>>,
  ): Promise<InferRouteOutput<T>>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientinvalidatequeries
   */
  invalidate(
    input?: DeepPartial<InferRouteOptions<T>>,
    filters?: Omit<InvalidateQueryFilters, 'predicate'> & {
      predicate?: (
        query: Query<
          InferRouteOptions<T>,
          InferRouteError<T>,
          InferRouteOptions<T>,
          EdenQueryKey<
            string[],
            InferRouteOptions<T>,
            InferRouteOptions<T> extends { cursor?: any } | void ? 'infinite' : 'query'
          >
        >,
      ) => boolean
    },
    options?: InvalidateOptions,
  ): Promise<void>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientrefetchqueries
   */
  refetch(
    input?: InferRouteOptions<T>,
    filters?: RefetchQueryFilters,
    options?: RefetchOptions,
  ): Promise<void>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientcancelqueries
   */
  cancel(input?: InferRouteOptions<T>, options?: CancelOptions): Promise<void>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientresetqueries
   */
  reset(input?: InferRouteOptions<T>, options?: ResetOptions): Promise<void>

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientsetquerydata
   */
  setData(
    /**
     * The input of the procedure
     */
    input: InferRouteOptions<T>,
    updater: Updater<InferRouteOutput<T> | undefined, InferRouteOutput<T> | undefined>,
    options?: SetDataOptions,
  ): void

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientsetquerydata
   */
  setQueriesData(
    /**
     * The input of the procedure
     */
    input: InferRouteOptions<T>,
    filters: QueryFilters,
    updater: Updater<InferRouteOutput<T> | undefined, InferRouteOutput<T> | undefined>,
    options?: SetDataOptions,
  ): [QueryKey, InferRouteOutput<T>]

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientsetquerydata
   */
  setInfiniteData(
    input: InferRouteOptions<T>,
    updater: Updater<
      | InfiniteData<
          InferRouteOutput<T>,
          NonNullable<ExtractCursorType<InferRouteOptions<T>>> | null
        >
      | undefined,
      | InfiniteData<
          InferRouteOutput<T>,
          NonNullable<ExtractCursorType<InferRouteOptions<T>>> | null
        >
      | undefined
    >,
    options?: SetDataOptions,
  ): void

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientgetquerydata
   */
  getData(input?: InferRouteOptions<T>): InferRouteOutput<T> | undefined

  /**
   * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientgetquerydata
   */
  getInfiniteData(
    input?: InferRouteOptions<T>,
  ):
    | InfiniteData<InferRouteOutput<T>, NonNullable<ExtractCursorType<InferRouteOutput<T>>> | null>
    | undefined
}

/**
 * Properties available at all levels of {@link EdenTreatyContext}.
 */
type EdenTreatyUniversalContext = {
  /**
   * Invalidate the full router.
   * @link https://trpc.io/docs/v10/useContext#query-invalidation
   * @link https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation
   */
  invalidate(
    input?: undefined,
    filters?: InvalidateQueryFilters,
    options?: InvalidateOptions,
  ): Promise<void>
}
