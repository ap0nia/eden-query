import type {
  EdenRequestParams,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
} from '@elysiajs/eden'
import {
  type CreateInfiniteQueryOptions,
  type CreateInfiniteQueryResult,
  type InfiniteData,
  type InfiniteQueryObserverSuccessResult,
  type SkipToken,
  skipToken,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'

import type { EdenQueryConfig } from '../../config'
import type { EdenContextState } from '../../context'
import type { DistributiveOmit } from '../../utils/types'
import type { ExtractCursorType, ReservedInfiniteQueryKeys } from '../internal/infinite-query'
import type { ParsedPathAndMethod } from '../internal/parse-paths-and-method'
import type { EdenQueryBaseOptions } from '../internal/query-base-options'
import type { WithEdenQueryExtension } from '../internal/query-hook-extension'
import { getQueryKey } from '../internal/query-key'

export interface EdenCreateInfiniteQueryOptions<TInput, TOutput, TError>
  extends DistributiveOmit<
      CreateInfiniteQueryOptions<TOutput, TError, TOutput, TOutput, any, ExtractCursorType<TInput>>,
      'queryKey' | 'initialPageParam'
    >,
    EdenQueryBaseOptions {
  initialCursor?: ExtractCursorType<TInput>
}

export type EdenCreateInfiniteQueryResult<TData, TError, TInput> = WithEdenQueryExtension<
  CreateInfiniteQueryResult<
    InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>,
    TError
  >
>

export type EdenCreateInfiniteQuerySuccessResult<TData, TError, TInput> = WithEdenQueryExtension<
  InfiniteQueryObserverSuccessResult<
    InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>,
    TError
  >
>

export type EdenCreateInfiniteQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute, ReservedInfiniteQueryKeys>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = (
  input: TInput | SkipToken,
  options: EdenCreateInfiniteQueryOptions<TInput, TOutput, TError>,
) => EdenCreateInfiniteQueryResult<TOutput, TError, TInput>

export function edenCreateInfiniteQueryOptions(
  parsedPathsAndMethod: ParsedPathAndMethod,
  context: EdenContextState<any, any>,
  input?: any,
  options?: EdenCreateInfiniteQueryOptions<unknown, unknown, any>,
  config?: EdenQueryConfig,
): CreateInfiniteQueryOptions {
  const { abortOnUnmount, client, queryClient } = context

  const { paths, path, method } = parsedPathsAndMethod

  const queryKey = getQueryKey(paths, input, 'query')

  const defaultOptions = queryClient.getQueryDefaults(queryKey)

  const initialQueryOptions = { ...defaultOptions, ...options }

  const { eden, ...queryOptions } = initialQueryOptions

  const resolvedQueryOptions = {
    ...queryOptions,
    initialPageParam: queryOptions.initialCursor ?? null,
    queryKey,
  } as CreateInfiniteQueryOptions

  if (input === skipToken) {
    resolvedQueryOptions.queryFn = input
    return resolvedQueryOptions
  }

  resolvedQueryOptions.queryFn = async (queryFunctionContext) => {
    const params = {
      ...config,
      path,
      method,
      options: { ...input },
      ...eden,
    } satisfies EdenRequestParams

    const shouldForwardSignal = config?.abortOnUnmount ?? eden?.abortOnUnmount ?? abortOnUnmount

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
