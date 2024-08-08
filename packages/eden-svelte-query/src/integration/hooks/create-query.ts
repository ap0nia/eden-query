import {
  type EdenRequestParams,
  type InferRouteError,
  type InferRouteOptions,
  type InferRouteOutput,
} from '@elysiajs/eden'
import {
  type CreateBaseQueryOptions,
  type CreateQueryOptions,
  type CreateQueryResult,
  type DefinedCreateQueryResult,
  type InitialDataFunction,
  type SkipToken,
  skipToken,
  type StoreOrVal,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'

import type { EdenQueryConfig } from '../../config'
import type { EdenContextState } from '../../context'
import type { DistributiveOmit } from '../../utils/types'
import type { ParsedPathAndMethod } from '../internal/parse-paths-and-method'
import type { EdenQueryBaseOptions } from '../internal/query-base-options'
import type { WithEdenQueryExtension } from '../internal/query-hook-extension'
import { getQueryKey } from '../internal/query-key'

export type EdenCreateQueryOptions<
  TOutput,
  TData,
  TError,
  TQueryOptsData = TOutput,
> = DistributiveOmit<
  CreateBaseQueryOptions<TOutput, TError, TData, TQueryOptsData, any>,
  'queryKey'
> &
  EdenQueryBaseOptions

export type EdenDefinedCreateQueryOptions<
  TOutput,
  TData,
  TError,
  TQueryOptsData = TOutput,
> = DistributiveOmit<
  CreateBaseQueryOptions<TOutput, TError, TData, TQueryOptsData, any>,
  'queryKey'
> &
  EdenQueryBaseOptions & {
    initialData: InitialDataFunction<TQueryOptsData> | TQueryOptsData
  }

export type EdenCreateQueryResult<TData, TError> = WithEdenQueryExtension<
  CreateQueryResult<TData, TError>
>

export type EdenDefinedCreateQueryResult<TData, TError> = WithEdenQueryExtension<
  DefinedCreateQueryResult<TData, TError>
>

export interface EdenCreateQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> {
  <TQueryFnData extends TOutput = TOutput, TData = TQueryFnData>(
    input: StoreOrVal<{} extends TInput ? void | TInput : TInput>,
    options: EdenDefinedCreateQueryOptions<TQueryFnData, TData, TError, TOutput>,
  ): EdenDefinedCreateQueryResult<TData, TError>

  <TQueryFnData extends TOutput = TOutput, TData = TQueryFnData>(
    input: StoreOrVal<({} extends TInput ? void | TInput : TInput) | SkipToken>,
    options?: EdenCreateQueryOptions<TQueryFnData, TData, TError, TOutput>,
  ): EdenCreateQueryResult<TData, TError>
}

export function edenCreateQueryOptions(
  parsedPathsAndMethod: ParsedPathAndMethod,
  context: EdenContextState<any, any>,
  input?: any,
  options?: EdenCreateQueryOptions<unknown, unknown, any>,
  config?: EdenQueryConfig,
): CreateQueryOptions {
  const { abortOnUnmount, client, queryClient } = context

  const { paths, path, method } = parsedPathsAndMethod

  const queryKey = getQueryKey(paths, input, 'query')

  const defaultOptions = queryClient.getQueryDefaults(queryKey)

  const initialQueryOptions = { ...defaultOptions, ...options }

  const { eden, ...queryOptions } = initialQueryOptions

  const resolvedQueryOptions = { ...queryOptions, queryKey }

  if (input === skipToken) {
    resolvedQueryOptions.queryFn = input
    return resolvedQueryOptions
  }

  resolvedQueryOptions.queryFn = async (queryFunctionContext) => {
    const params: EdenRequestParams = {
      ...config,
      path,
      method,
      options: input,
      ...eden,
    }

    const shouldForwardSignal = config?.abortOnUnmount ?? eden?.abortOnUnmount ?? abortOnUnmount

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
