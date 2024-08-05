import {
  EdenClient,
  type EdenRequestParams,
  type InferRouteError,
  type InferRouteOptions,
  type InferRouteOutput,
} from '@elysiajs/eden'
import type {
  DefinedUseQueryResult,
  InitialDataFunction,
  SkipToken,
  UndefinedInitialDataOptions,
  UseBaseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'
import type { RouteSchema } from 'elysia'

import type { DistributiveOmit } from '../../utils/types'
import { parsePathsAndMethod } from '../internal/helpers'
import type { EdenUseQueryBaseOptions } from '../internal/query-base-options'
import type { EdenQueryHookExtension } from '../internal/query-hook-extension'
import { getQueryKey } from '../internal/query-key'
import type { EdenQueryRequestOptions } from '../internal/query-request-options'

export type EdenUseQueryOptions<
  TOutput,
  TData,
  TError,
  TQueryOptsData = TOutput,
> = DistributiveOmit<UseBaseQueryOptions<TOutput, TError, TData, TQueryOptsData, any>, 'queryKey'> &
  EdenUseQueryBaseOptions

export type EdenDefinedUseQueryOptions<
  TOutput,
  TData,
  TError,
  TQueryOptsData = TOutput,
> = DistributiveOmit<UseBaseQueryOptions<TOutput, TError, TData, TQueryOptsData, any>, 'queryKey'> &
  EdenUseQueryBaseOptions & {
    initialData: InitialDataFunction<TQueryOptsData> | TQueryOptsData
  }

export type EdenUseQueryResult<TData, TError> = UseQueryResult<TData, TError> &
  EdenQueryHookExtension

export type EdenDefinedUseQueryResult<TData, TError> = DefinedUseQueryResult<TData, TError> &
  EdenQueryHookExtension

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

export function useEdenQueryOptions(
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
