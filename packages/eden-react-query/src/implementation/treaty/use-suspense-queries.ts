import type {
  EdenClient,
  EmptyToVoid,
  ExtractEdenTreatyRouteParams,
  ExtractEdenTreatyRouteParamsInput,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
} from '@ap0nia/eden'
import type { SuspenseQueriesOptions, UseSuspenseQueryResult } from '@tanstack/react-query'
import type { AnyElysia, RouteSchema } from 'elysia'

import type { UseQueryOptionsForUseSuspenseQueries } from '../../integration/internal/use-query-options-for-use-suspense-queries'
import { createTreatyUseQueriesProxy } from './use-queries'

export type EdenTreatyUseSuspenseQueries<T extends AnyElysia> = <
  TData extends any[],
  TQueriesOptions extends SuspenseQueriesOptions<TData>,
>(
  queriesCallback: (t: EdenTreatyUseSuspenseQueriesProxy<T>) => readonly [...TQueriesOptions],
) => UseSuspenseQueriesResult<TQueriesOptions>

/**
 * A proxy object that returns {@link CreateQueryOptions} (instead of an actual create query result).
 * Passed to `createQueries` caller to use.
 */
export type EdenTreatyUseSuspenseQueriesProxy<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatyUseSuspenseQueriesProxyMapping<TSchema>
  : 'Please install Elysia before using Eden'

export type EdenTreatyUseSuspenseQueriesProxyMapping<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
  TRouteParams = ExtractEdenTreatyRouteParams<TSchema>,
> = {
  [K in Exclude<keyof TSchema, keyof TRouteParams>]: TSchema[K] extends RouteSchema
    ? UseSuspenseQueriesHook<TSchema[K], [...TPath, K]>
    : EdenTreatyUseSuspenseQueriesProxyMapping<TSchema[K], [...TPath, K]>
} & ({} extends TRouteParams
  ? {}
  : (
      params: ExtractEdenTreatyRouteParamsInput<TRouteParams>,
    ) => EdenTreatyUseSuspenseQueriesProxyMapping<
      TSchema[Extract<keyof TRouteParams, keyof TSchema>],
      TPath
    >)

/**
 * When a route is encountered, it is replaced with a callable function that takes the same inputs.
 */
export type UseSuspenseQueriesHook<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>['query'],
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = (
  input: EmptyToVoid<TInput>,
  opts?: UseQueryOptionsForUseSuspenseQueries<TOutput, TError>,
) => UseQueryOptionsForUseSuspenseQueries<TOutput, TError>

export function createTreatyUseSuspenseQueriesProxy<T extends AnyElysia = AnyElysia>(
  client: EdenClient<T>,
  paths: string[] = [],
): EdenTreatyUseSuspenseQueriesProxy<T> {
  return createTreatyUseQueriesProxy(client, paths) as any
}

export type UseSuspenseQueriesResult<
  TQueriesOptions extends UseQueryOptionsForUseSuspenseQueries<any, any, any, any>[],
> = [
  {
    [TKey in keyof TQueriesOptions]: TQueriesOptions[TKey] extends UseQueryOptionsForUseSuspenseQueries<
      infer TQueryFnData,
      any,
      infer TData,
      any
    >
      ? unknown extends TData
        ? TQueryFnData
        : TData
      : never
  },
  {
    [TKey in keyof TQueriesOptions]: TQueriesOptions[TKey] extends UseQueryOptionsForUseSuspenseQueries<
      infer TQueryFnData,
      infer TError,
      infer TData,
      any
    >
      ? UseSuspenseQueryResult<unknown extends TData ? TQueryFnData : TData, TError>
      : never
  },
]
