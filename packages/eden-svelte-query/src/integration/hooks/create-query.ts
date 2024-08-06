import {
  EdenClient,
  type EdenRequestParams,
  type InferRouteError,
  type InferRouteOptions,
  type InferRouteOutput,
} from '@elysiajs/eden'
import type {
  CreateBaseQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
  InitialDataFunction,
  SkipToken,
  UndefinedInitialDataOptions,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'

import type { DistributiveOmit } from '../../utils/types'
import { parsePathsAndMethod } from '../internal/parse-paths-and-method'
import type { EdenQueryBaseOptions } from '../internal/query-base-options'
import type { WithEdenQueryExtension } from '../internal/query-hook-extension'
import { getQueryKey } from '../internal/query-key'
import type { EdenQueryRequestOptions } from '../internal/query-request-options'

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
    input: {} extends TInput ? void | TInput : TInput,
    options: EdenDefinedCreateQueryOptions<TQueryFnData, TData, TError, TOutput>,
  ): EdenDefinedCreateQueryResult<TData, TError>

  <TQueryFnData extends TOutput = TOutput, TData = TQueryFnData>(
    input: ({} extends TInput ? void | TInput : TInput) | SkipToken,
    options?: EdenCreateQueryOptions<TQueryFnData, TData, TError, TOutput>,
  ): EdenCreateQueryResult<TData, TError>
}

export function useEdenQueryOptions(
  client: EdenClient,
  config?: EdenQueryRequestOptions,
  originalPaths: string[] = [],
  args: any[] = [],
): UndefinedInitialDataOptions {
  const { paths, path, method } = parsePathsAndMethod(originalPaths)

  const { eden, ...queryOptions } = (args[1] ?? {}) as EdenCreateQueryOptions<any, any, any>

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
