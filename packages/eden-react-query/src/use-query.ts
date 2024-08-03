import {
  EdenClient,
  type EdenRequestOptions,
  type EdenRequestParams,
  type InferRouteError,
  type InferRouteOptions,
  type InferRouteOutput,
} from '@elysiajs/eden'
import { isHttpMethod } from '@elysiajs/eden/utils/http.ts'
import type {
  DefinedUseQueryResult,
  FetchQueryOptions,
  InitialDataFunction,
  QueryOptions,
  SkipToken,
  UndefinedInitialDataOptions,
  UseBaseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'
import type { RouteSchema } from 'elysia'

import type { EdenHookResult } from './hook'
import { type EdenQueryKey, getQueryKey } from './query-key'
import type { EdenQueryRequestOptions } from './request'
import type { DistributiveOmit } from './utils/types'

/**
 * Additional options for queries.
 */
export type EdenUseQueryBaseOptions = {
  /**
   * eden-related options
   */
  eden?: EdenQueryRequestOptions
}

export type EdenUseQueryOptions<
  TOutput,
  TData,
  TError,
  TQueryOptsData = TOutput,
> = DistributiveOmit<UseBaseQueryOptions<TOutput, TError, TData, TQueryOptsData, any>, 'queryKey'> &
  EdenUseQueryBaseOptions

export function useEdenQueryOptions(
  client: EdenClient,
  config?: EdenQueryRequestOptions,
  originalPaths: string[] = [],
  args: any[] = [],
): UndefinedInitialDataOptions {
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

  const { eden, ...queryOptions } = (args[1] ?? {}) as EdenUseQueryOptions<any, any, any>

  const params: EdenRequestParams = {
    ...config,
    ...eden,
    fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
  }

  const options = args[0] as InferRouteOptions

  const path = '/' + paths.join('/')

  const baseQueryOptions: UndefinedInitialDataOptions = {
    queryKey: getQueryKey(paths, options, 'query'),
    queryFn: async (context) => {
      const resolvedParams = { path, method, options, ...params }

      if (Boolean(config?.abortOnUnmount) || Boolean(eden?.abortOnUnmount)) {
        resolvedParams.fetch = { ...resolvedParams.fetch }
        resolvedParams.fetch.signal = context.signal
      }

      const result = await client.query(resolvedParams)

      if (result.error != null) {
        throw result.error
      }

      return result.data
    },
    ...queryOptions,
  }

  return baseQueryOptions
}

export type EdenDefinedUseQueryOptions<
  TOutput,
  TData,
  TError,
  TQueryOptsData = TOutput,
> = DistributiveOmit<UseBaseQueryOptions<TOutput, TError, TData, TQueryOptsData, any>, 'queryKey'> &
  EdenUseQueryBaseOptions & {
    initialData: InitialDataFunction<TQueryOptsData> | TQueryOptsData
  }

export type EdenUseQueryResult<TData, TError> = UseQueryResult<TData, TError> & EdenHookResult

export type EdenDefinedUseQueryResult<TData, TError> = DefinedUseQueryResult<TData, TError> &
  EdenHookResult

export interface EdenUseQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> {
  <TQueryFnData extends TOutput = TOutput, TData = TQueryFnData>(
    input: {} extends TInput ? void | TInput : TInput,
    options: EdenDefinedUseQueryOptions<TQueryFnData, TData, TError, TOutput>,
  ): EdenDefinedUseQueryResult<TData, TError>

  <TQueryFnData extends TOutput = TOutput, TData = TQueryFnData>(
    input: ({} extends TInput ? void | TInput : TInput) | SkipToken,
    options?: EdenUseQueryOptions<TQueryFnData, TData, TError, TOutput>,
  ): EdenUseQueryResult<TData, TError>
}

export type EdenFetchQueryOptions<TOutput, TError> = DistributiveOmit<
  FetchQueryOptions<TOutput, TError>,
  'queryKey'
> &
  EdenRequestOptions

export interface EdenQueryOptions<TData, TError>
  extends DistributiveOmit<QueryOptions<TData, TError, TData, any>, 'queryKey'>,
    EdenUseQueryBaseOptions {
  queryKey: EdenQueryKey
}
