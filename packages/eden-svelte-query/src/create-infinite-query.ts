import type {
  EdenClient,
  EdenRequestParams,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
} from '@elysiajs/eden'
import { isHttpMethod } from '@elysiajs/eden/utils/http.ts'
import type {
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  InfiniteData,
  SkipToken,
  StoreOrVal,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'

import type { EdenCreateQueryBaseOptions } from './create-query'
import type { EdenHookResult } from './hook'
import { getQueryKey } from './query-key'
import type { EdenQueryRequestOptions } from './request'
import type { DistributiveOmit } from './utils/types'

/**
 * Key in params or query that indicates GET routes that are eligible for infinite queries.
 */
export type InfiniteCursorKey = 'cursor'

/**
 * When providing request input to infinite queries, omit the "cursor" and "direction" properties
 * since these will be set by the integration.
 */
export type ReservedInfiniteQueryKeys = InfiniteCursorKey | 'direction'

/**
 * Given T, which is presumably a {@link RouteSchema}, merge the "params" and "query" types,
 * then extract the "cursor".
 */
export type ExtractCursorType<T> =
  T extends Record<string, any> ? (T['params'] & T['query'])['cursor'] : unknown

export type EdenCreateInfiniteQueryOptions<TInput, TOutput, TError> = DistributiveOmit<
  CreateInfiniteQueryOptions<TOutput, TError, TOutput, TOutput, any, ExtractCursorType<TInput>>,
  'queryKey' | 'initialPageParam'
> &
  EdenCreateQueryBaseOptions & {
    initialCursor?: ExtractCursorType<TInput>
  }

export function createEdenInfiniteQueryOptions(
  client: EdenClient,
  config?: EdenQueryRequestOptions,
  paths: string[] = [],
  args: any[] = [],
): CreateInfiniteQueryOptions {
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

  const path = '/' + paths.join('/')

  const { eden, ...queryOptions } = (args[1] ?? {}) as EdenCreateInfiniteQueryOptions<any, any, any>

  const params: EdenRequestParams = {
    ...config,
    ...eden,
    path,
    fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
  }

  if (methodIsHttpMethod) {
    params.method = method
  }

  const options = args[0] as InferRouteOptions

  const infiniteQueryOptions: CreateInfiniteQueryOptions = {
    queryKey: getQueryKey(paths, options, 'infinite'),
    initialPageParam: 0,
    queryFn: async (context) => {
      const resolvedParams = { options, ...params }

      if (Boolean(config?.abortOnUnmount) || Boolean(eden?.abortOnUnmount)) {
        resolvedParams.fetch = { ...resolvedParams.fetch }
        resolvedParams.fetch.signal = context.signal
      }

      // FIXME: scuffed way to set cursor. Not sure how to tell if the cursor will be
      // in the route params or query.
      // e.g. /api/pages/:cursor -> /api/pages/1 or /api/pages?cursor=1

      if (resolvedParams.options.query) {
        ;(resolvedParams.options.query as any)['cursor'] = context.pageParam
      } else if (resolvedParams.options.params) {
        ;(resolvedParams.options.params as any)['cursor'] = context.pageParam
      }

      const result = await client.query(resolvedParams)

      if (result.error != null) {
        throw result.error
      }

      return result.data
    },
    ...queryOptions,
  }

  return infiniteQueryOptions
}

export type EdenCreateInfiniteQueryResult<TData, TError, TInput> = CreateInfiniteQueryResult<
  InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>,
  TError
> &
  EdenHookResult

/**
 * @todo: remove "cursor" or equivalent from infinite input...
 */
export type EdenCreateInfiniteQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = (
  input: StoreOrVal<TInput | SkipToken>,
  options: StoreOrVal<EdenCreateInfiniteQueryOptions<TInput, TOutput, TError>>,
) => EdenCreateInfiniteQueryResult<TOutput, TError, TInput>
