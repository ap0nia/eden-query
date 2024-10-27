import {
  type EdenRequestParams,
  type EmptyToVoid,
  type InferRouteError,
  type InferRouteOptions,
  type InferRouteOutput,
  type ParsedPathAndMethod,
} from '@ap0nia/eden'
import {
  type DefinedUseQueryResult,
  type InitialDataFunction,
  QueryClient,
  type QueryKey,
  type QueryObserverOptions,
  type SkipToken,
  skipToken,
  type UseBaseQueryOptions,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query'
import type { RouteSchema } from 'elysia'

import type { EdenQueryConfig } from '../../config'
import { type EdenContextState, type SSRState, useSSRQueryOptionsIfNeeded } from '../../context'
import type { DistributiveOmit } from '../../utils/types'
import type { EdenQueryBaseOptions } from '../internal/query-base-options'
import type { WithEdenQueryExtension } from '../internal/query-hook-extension'
import { getQueryKey } from '../internal/query-key'

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
  // The publicly exposed `useQuery` hook only accepts the `query` object.
  TInput = InferRouteOptions<TRoute>['query'],
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> {
  <TQueryFnData extends TOutput = TOutput, TData = TQueryFnData>(
    input: EmptyToVoid<TInput>,
    options: EdenDefinedUseQueryOptions<TQueryFnData, TData, TError, TOutput>,
  ): EdenDefinedUseQueryResult<TData, TError>

  <TQueryFnData extends TOutput = TOutput, TData = TQueryFnData>(
    input: EmptyToVoid<TInput> | SkipToken,
    options?: EdenUseQueryOptions<TQueryFnData, TData, TError, TOutput>,
  ): EdenUseQueryResult<TData, TError>
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

export function edenUseQueryOptions(
  parsedPathAndMethod: ParsedPathAndMethod,
  context: EdenContextState<any, any>,
  // The internal helper to `useQueryOptions` receives the entire input object, including `query` and `params`.
  input?: InferRouteOptions | SkipToken,
  options?: EdenUseQueryOptions<unknown, unknown, any>,
  config?: EdenQueryConfig,
): UseQueryOptions {
  const { abortOnUnmount, client, ssrState, queryClient, prefetchQuery } = context

  const { paths, path, method } = parsedPathAndMethod

  const isInputSkipToken = input === skipToken && typeof input !== 'object'

  const queryKey = getQueryKey(paths, isInputSkipToken ? undefined : input, 'query')

  const defaultOptions = queryClient.getQueryDefaults(queryKey)

  if (isServerQuery(ssrState, options, defaultOptions, isInputSkipToken, queryClient, queryKey)) {
    void prefetchQuery(queryKey, options)
  }

  const initialQueryOptions = { ...defaultOptions, ...options }

  const ssrQueryOptions = useSSRQueryOptionsIfNeeded(queryKey, initialQueryOptions, context)

  const { eden, ...queryOptions } = ssrQueryOptions

  const resolvedQueryOptions = { ...queryOptions, queryKey }

  if (isInputSkipToken) {
    resolvedQueryOptions.queryFn = input
    return resolvedQueryOptions
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

    if (result.error != null) {
      throw result.error
    }

    return result.data
  }

  return resolvedQueryOptions
}
