import {
  EdenClient,
  type EdenRequestParams,
  type InferRouteError,
  type InferRouteOptions,
  type InferRouteOutput,
} from '@elysiajs/eden'
import { isHttpMethod } from '@elysiajs/eden/utils/http.ts'
import type {
  CreateBaseQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
  InitialDataFunction,
  SkipToken,
  StoreOrVal,
  UndefinedInitialDataOptions,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'

import type { EdenHookResult } from './hook'
import { getQueryKey } from './query-key'
import type { EdenQueryRequestOptions } from './request'
import type { DistributiveOmit } from './utils/types'

/**
 * Additional options for queries.
 */
export type EdenCreateQueryBaseOptions = {
  /**
   * eden-related options
   */
  eden?: EdenQueryRequestOptions
}

export type EdenCreateQueryOptions<
  TOutput,
  TData,
  TError,
  TQueryOptsData = TOutput,
> = DistributiveOmit<
  CreateBaseQueryOptions<TOutput, TError, TData, TQueryOptsData, any>,
  'queryKey'
> &
  EdenCreateQueryBaseOptions

export function createEdenQueryOptions(
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

  const methodIsHttpMethod = isHttpMethod(method)

  if (methodIsHttpMethod) {
    paths.pop()
  }

  const path = '/' + paths.join('/')

  const { eden, ...queryOptions } = (args[1] ?? {}) as EdenCreateQueryOptions<any, any, any>

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

  const baseQueryOptions: UndefinedInitialDataOptions = {
    queryKey: getQueryKey(paths, options, 'query'),
    queryFn: async (context) => {
      const resolvedParams = { options, ...params }

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

export type EdenDefinedCreateQueryOptions<
  TOutput,
  TData,
  TError,
  TQueryOptsData = TOutput,
> = DistributiveOmit<
  CreateBaseQueryOptions<TOutput, TError, TData, TQueryOptsData, any>,
  'queryKey'
> &
  EdenCreateQueryBaseOptions & {
    initialData: InitialDataFunction<TQueryOptsData> | TQueryOptsData
  }

export type EdenCreateQueryResult<TData, TError> = CreateQueryResult<TData, TError> & EdenHookResult

export type EdenDefinedCreateQueryResult<TData, TError> = DefinedCreateQueryResult<TData, TError> &
  EdenHookResult

export interface EdenCreateQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> {
  <TQueryFnData extends TOutput = TOutput, TData = TQueryFnData>(
    input: StoreOrVal<{} extends TInput ? void | TInput : TInput>,
    options: StoreOrVal<EdenDefinedCreateQueryOptions<TQueryFnData, TData, TError, TOutput>>,
  ): EdenDefinedCreateQueryResult<TData, TError>

  <TQueryFnData extends TOutput = TOutput, TData = TQueryFnData>(
    input: StoreOrVal<({} extends TInput ? void | TInput : TInput) | SkipToken>,
    options?: StoreOrVal<EdenCreateQueryOptions<TQueryFnData, TData, TError, TOutput>>,
  ): EdenCreateQueryResult<TData, TError>
}
