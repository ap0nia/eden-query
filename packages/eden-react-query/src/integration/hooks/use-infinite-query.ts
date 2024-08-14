import type { InferRouteError, InferRouteOptions, InferRouteOutput } from '@ap0nia/eden'
import {
  type InfiniteData,
  type InfiniteQueryObserverSuccessResult,
  type SkipToken,
  skipToken,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import type { RouteSchema } from 'elysia'

import { type EdenContextState, useSSRQueryOptionsIfNeeded } from '../../context'
import type { DistributiveOmit } from '../../utils/types'
import type { ExtractCursorType, ReservedInfiniteQueryKeys } from '../internal/infinite-query'
import type { ParsedPathAndMethod } from '../internal/parse-paths-and-method'
import type { EdenQueryBaseOptions } from '../internal/query-base-options'
import type { WithEdenQueryExtension } from '../internal/query-hook-extension'
import { getQueryKey } from '../internal/query-key'
import { isServerQuery } from './use-query'

export interface EdenUseInfiniteQueryOptions<TInput, TOutput, TError>
  extends DistributiveOmit<
      UseInfiniteQueryOptions<TOutput, TError, TOutput, TOutput, any, ExtractCursorType<TInput>>,
      'queryKey' | 'initialPageParam'
    >,
    EdenQueryBaseOptions {
  initialCursor?: ExtractCursorType<TInput>
}

export type EdenUseInfiniteQueryResult<TData, TError, TInput> = WithEdenQueryExtension<
  UseInfiniteQueryResult<InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>, TError>
>

export type EdenUseInfiniteQuerySuccessResult<TData, TError, TInput> = WithEdenQueryExtension<
  InfiniteQueryObserverSuccessResult<
    InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>,
    TError
  >
>

export type EdenUseInfiniteQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TInfiniteInput = InferRouteOptions<TRoute, ReservedInfiniteQueryKeys>,
> = (
  input: TInfiniteInput | SkipToken,
  options: EdenUseInfiniteQueryOptions<TInput, TOutput, TError>,
) => EdenUseInfiniteQueryResult<TOutput, TError, TInput>

export function edenUseInfiniteQueryOptions(
  parsedPathAndMethod: ParsedPathAndMethod,
  context: EdenContextState<any, any>,
  input?: any,
  options?: EdenUseInfiniteQueryOptions<unknown, unknown, any>,
  config?: any,
): UseInfiniteQueryOptions {
  const { client, ssrState, prefetchInfiniteQuery, queryClient, abortOnUnmount } = context

  const { paths, path, method } = parsedPathAndMethod

  const queryKey = getQueryKey(paths, input, 'infinite')

  const defaultOptions = queryClient.getQueryDefaults(queryKey)

  const initialQueryOptions = { ...defaultOptions, ...options }

  const isInputSkipToken = input === skipToken

  if (isServerQuery(ssrState, options, defaultOptions, isInputSkipToken, queryClient, queryKey)) {
    void prefetchInfiniteQuery(queryKey, initialQueryOptions as any)
  }

  const ssrQueryOptions = useSSRQueryOptionsIfNeeded(queryKey, initialQueryOptions, context)

  const { eden, ...queryOptions } = ssrQueryOptions

  const resolvedQueryOptions = {
    ...queryOptions,
    initialPageParam: queryOptions.initialCursor ?? null,
    queryKey,
  } as UseInfiniteQueryOptions

  if (isInputSkipToken) {
    resolvedQueryOptions.queryFn = input
    return resolvedQueryOptions
  }

  resolvedQueryOptions.queryFn = async (queryFunctionContext) => {
    const options = { ...input }

    const params = {
      ...config,
      options,
      path,
      method,
      ...eden,
    }

    const shouldForwardSignal = eden?.abortOnUnmount ?? config?.abortOnUnmount ?? abortOnUnmount

    if (shouldForwardSignal) {
      params.fetch = { ...params.fetch, signal: queryFunctionContext.signal }
    }

    // FIXME: scuffed way to set cursor. Not sure how to tell if the cursor will be
    // in the route params or query.
    // e.g. /api/pages/:cursor -> /api/pages/1 or /api/pages?cursor=1

    if (queryFunctionContext.pageParam != null) {
      if (params.options.query) {
        ;(params.options.query as any)['cursor'] = queryFunctionContext.pageParam
      } else if (params.options.params) {
        ;(params.options.params as any)['cursor'] = queryFunctionContext.pageParam
      }
    }

    const result = await client.query(params)

    if (result.error != null) {
      throw result.error
    }

    return result.data
  }

  return resolvedQueryOptions
}
