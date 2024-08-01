import type {
  EdenClient,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
} from '@elysiajs/eden'
import type {
  QueryKey,
  SuspenseQueriesOptions,
  SuspenseQueriesResults,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query'
import type { AnyElysia, RouteSchema } from 'elysia'

import type { DistributiveOmit } from './utils/types'

/**
 * @internal
 */
export type EdenUseSuspenseQueries<T extends AnyElysia> = <
  TData extends any[],
  TCombinedResult = SuspenseQueriesResults<TData>,
>(
  queriesCallback: (
    t: EdenUseSuspenseQueriesProxy<T>,
  ) => readonly [...SuspenseQueriesOptions<TData>],
) => TCombinedResult

/**
 * A proxy object that returns {@link CreateQueryOptions} (instead of an actual create query result).
 * Passed to `createQueries` caller to use.
 */
export type EdenUseSuspenseQueriesProxy<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenUseSuspenseQueriesProxyMapping<TSchema>
  : 'Please install Elysia before using Eden'

/**
 * Implementation.
 */
export type EdenUseSuspenseQueriesProxyMapping<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? UseSuspenseQueriesHook<TSchema[K], [...TPath, K]>
    : EdenUseSuspenseQueriesProxyMapping<TSchema[K], [...TPath, K]>
}

/**
 * When a route is encountered, it is replaced with a callable function that takes the same inputs.
 */
export type UseSuspenseQueriesHook<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput extends InferRouteOptions<TRoute> = InferRouteOptions<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = (
  input: TInput,
  opts?: UseQueryOptionsForUseSuspenseQueries<TOutput, TInput, TError>,
) => UseQueryOptionsForUseSuspenseQueries<TOutput, TInput, TError>

/**
 * @internal
 */
export type UseQueryOptionsForUseSuspenseQueries<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = DistributiveOmit<UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey'>

export function createUseSuspenseQueriesProxy<T extends AnyElysia = AnyElysia>(
  client: EdenClient<T>,
  paths: string[] = [],
): EdenUseSuspenseQueriesProxy<T> {
  return createUseQueriesProxy(client, paths)
}
