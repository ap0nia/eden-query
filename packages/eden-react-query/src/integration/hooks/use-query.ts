import {
  EdenClient,
  type EdenRequestParams,
  type InferRouteError,
  type InferRouteOptions,
  type InferRouteOutput,
} from '@elysiajs/eden'
import {
  type DefinedUseQueryResult,
  type InitialDataFunction,
  QueryClient,
  type QueryKey,
  type QueryObserverOptions,
  type SkipToken,
  skipToken,
  type UndefinedInitialDataOptions,
  type UseBaseQueryOptions,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query'
import type { RouteSchema } from 'elysia'

import { type EdenContextState, type SSRState, useSSRQueryOptionsIfNeeded } from '../../context'
import { isAsyncIterable } from '../../utils/is-async-iterable'
import type { DistributiveOmit } from '../../utils/types'
import { parsePathsAndMethod } from '../internal/helpers'
import type { EdenQueryBaseOptions } from '../internal/query-base-options'
import type { WithEdenQueryExtension } from '../internal/query-hook-extension'
import { getQueryKey } from '../internal/query-key'
import type { EdenQueryRequestOptions } from '../internal/query-request-options'

export type EdenUseQueryOptions<
  TOutput,
  TData,
  TError,
  TQueryOptsData = TOutput,
> = DistributiveOmit<UseBaseQueryOptions<TOutput, TError, TData, TQueryOptsData, any>, 'queryKey'> &
  EdenQueryBaseOptions

export type EdenDefinedUseQueryOptions<
  TOutput,
  TData,
  TError,
  TQueryOptsData = TOutput,
> = DistributiveOmit<UseBaseQueryOptions<TOutput, TError, TData, TQueryOptsData, any>, 'queryKey'> &
  EdenQueryBaseOptions & {
    initialData: InitialDataFunction<TQueryOptsData> | TQueryOptsData
  }

export type EdenUseQueryResult<TData, TError> = WithEdenQueryExtension<
  UseQueryResult<TData, TError>
>

export type EdenDefinedUseQueryResult<TData, TError> = WithEdenQueryExtension<
  DefinedUseQueryResult<TData, TError>
>

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

export function edenUseQueryOptions(
  client: EdenClient,
  config?: EdenQueryRequestOptions,
  originalPaths: string[] = [],
  args: any[] = [],
): UndefinedInitialDataOptions {
  const { paths, path, method } = parsePathsAndMethod(originalPaths)

  const { eden, ...queryOptions } = (args[1] ?? {}) as EdenUseQueryOptions<any, any, any>

  /**
   * @todo rename this to "input"?
   */
  const options = args[0] as InferRouteOptions

  /**
   * Dynamically generate query options based on the information provided by eden-query.
   */
  const edenQueryOptions: UndefinedInitialDataOptions = {
    queryKey: getQueryKey(paths, options, 'query'),
    queryFn: async (context) => {
      const params: EdenRequestParams = {
        ...config,
        ...eden,
        path,
        method,
        options,
        fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
      }

      const shouldForwardSignal = config?.abortOnUnmount ?? eden?.abortOnUnmount

      if (shouldForwardSignal) {
        params.fetch = { ...params.fetch, signal: context.signal }
      }

      const result = await client.query(params)

      if (result.error != null) {
        throw result.error
      }

      return result.data
    },
    ...queryOptions,
  }

  return edenQueryOptions
}

export function isServerQuery(
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

export type EdenUseQueryInfo = {
  paths: string[]
  path: string
  method?: string
  queryOptions: UseQueryOptions
  queryClient: QueryClient
}

export function getEdenUseQueryInfo(
  originalPaths: any = [],
  context: EdenContextState<any, any>,
  input?: any,
  options?: EdenUseQueryOptions<unknown, unknown, any>,
  config?: any,
): EdenUseQueryInfo {
  const { abortOnUnmount, client, ssrState, queryClient, prefetchQuery } = context

  const { paths, path, method } = parsePathsAndMethod(originalPaths)

  const queryKey = getQueryKey(paths, input, 'query')

  const defaultOptions = queryClient.getQueryDefaults(queryKey)

  const isInputSkipToken = input === skipToken

  if (isServerQuery(ssrState, options, defaultOptions, isInputSkipToken, queryClient, queryKey)) {
    void prefetchQuery(queryKey, options)
  }

  const initialQueryOptions = { ...defaultOptions, ...options }

  const ssrQueryOptions = useSSRQueryOptionsIfNeeded(queryKey, initialQueryOptions, context)

  const { eden, ...queryOptions } = ssrQueryOptions

  const resolvedQueryOptions = { ...queryOptions, queryKey }

  const info: EdenUseQueryInfo = {
    paths,
    path,
    method,
    queryOptions: resolvedQueryOptions,
    queryClient,
  }

  if (isInputSkipToken) {
    resolvedQueryOptions.queryFn = input
    return info
  }

  resolvedQueryOptions.queryFn = async (queryFunctionContext) => {
    const params: EdenRequestParams = {
      ...config,
      ...eden,
      options: input,
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

  return info
}
