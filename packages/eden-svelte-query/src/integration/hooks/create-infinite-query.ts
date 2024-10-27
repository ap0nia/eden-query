import type {
  EdenRequestParams,
  EmptyToVoid,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
  ParsedPathAndMethod,
} from '@ap0nia/eden'
import {
  type CreateInfiniteQueryOptions,
  type CreateInfiniteQueryResult,
  type InfiniteData,
  type InfiniteQueryObserverSuccessResult,
  type SkipToken,
  skipToken,
  type StoreOrVal,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'

import type { EdenQueryConfig } from '../../config'
import type { EdenContextState } from '../../context'
import type { DistributiveOmit } from '../../utils/types'
import type { ExtractQueryCursor, ReservedInfiniteQueryKeys } from '../internal/infinite-query'
import type { EdenQueryBaseOptions } from '../internal/query-base-options'
import type { WithEdenQueryExtension } from '../internal/query-hook-extension'
import { getQueryKey } from '../internal/query-key'

export interface EdenCreateInfiniteQueryOptions<TInput, TOutput, TError>
  extends DistributiveOmit<
      CreateInfiniteQueryOptions<
        TOutput,
        TError,
        TOutput,
        TOutput,
        any,
        ExtractQueryCursor<TInput>
      >,
      'queryKey' | 'initialPageParam'
    >,
    EdenQueryBaseOptions {
  initialCursor?: ExtractQueryCursor<TInput>
}

export type EdenCreateInfiniteQueryResult<TData, TError, TInput> = WithEdenQueryExtension<
  CreateInfiniteQueryResult<
    InfiniteData<TData, NonNullable<ExtractQueryCursor<TInput>> | null>,
    TError
  >
>

export type EdenCreateInfiniteQuerySuccessResult<TData, TError, TInput> = WithEdenQueryExtension<
  InfiniteQueryObserverSuccessResult<
    InfiniteData<TData, NonNullable<ExtractQueryCursor<TInput>> | null>,
    TError
  >
>

export type EdenCreateInfiniteQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  // The exposed public type for `createInfiniteQuery` only needs the `query` from the input options.
  TInput = InferRouteOptions<TRoute>['query'],
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TInfiniteInput = InferRouteOptions<TRoute, ReservedInfiniteQueryKeys>['query'],
> = (
  input: StoreOrVal<EmptyToVoid<TInfiniteInput> | SkipToken>,
  options: EdenCreateInfiniteQueryOptions<TInput, TOutput, TError>,
) => EdenCreateInfiniteQueryResult<TOutput, TError, TInput>

export function edenCreateInfiniteQueryOptions(
  parsedPathsAndMethod: ParsedPathAndMethod,
  context: EdenContextState<any, any>,
  // The helper `createInfiniteQueryOptions` receives the entire options object.
  input?: InferRouteOptions | SkipToken,
  options?: EdenCreateInfiniteQueryOptions<unknown, unknown, any>,
  config?: EdenQueryConfig,
): CreateInfiniteQueryOptions {
  const { abortOnUnmount, client, queryClient } = context

  const { paths, path, method } = parsedPathsAndMethod

  const isInputSkipToken = input === skipToken && typeof input !== 'object'

  const queryKey = getQueryKey(paths, isInputSkipToken ? undefined : input, 'query')

  const defaultOptions = queryClient.getQueryDefaults(queryKey)

  const initialQueryOptions = { ...defaultOptions, ...options }

  const { eden, ...queryOptions } = initialQueryOptions

  const resolvedQueryOptions = {
    ...queryOptions,
    initialPageParam: queryOptions.initialCursor ?? null,
    queryKey,
  } as CreateInfiniteQueryOptions

  if (isInputSkipToken) {
    resolvedQueryOptions.queryFn = input
    return resolvedQueryOptions
  }

  resolvedQueryOptions.queryFn = async (queryFunctionContext) => {
    const params: EdenRequestParams = {
      ...config,
      path,
      method,
      options: { ...input },
      ...eden,
    }

    const shouldForwardSignal = config?.abortOnUnmount ?? eden?.abortOnUnmount ?? abortOnUnmount

    if (shouldForwardSignal) {
      params.fetch = { ...params.fetch, signal: queryFunctionContext.signal }
    }

    // FIXME: scuffed way to set cursor. Not sure how to tell if the cursor will be
    // in the route params or query.
    // e.g. /api/pages/:cursor -> /api/pages/1 or /api/pages?cursor=1

    if (queryFunctionContext.pageParam != null) {
      if (params.options?.query) {
        ;(params.options.query as any)['cursor'] = queryFunctionContext.pageParam
      } else if (params.options?.params) {
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
