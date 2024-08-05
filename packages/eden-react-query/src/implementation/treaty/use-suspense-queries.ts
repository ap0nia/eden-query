import type {
  EdenClient,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
} from '@elysiajs/eden'
import type { SuspenseQueriesOptions, SuspenseQueriesResults } from '@tanstack/react-query'
import type { AnyElysia, RouteSchema } from 'elysia'

import type { UseQueryOptionsForUseSuspenseQueries } from '../../integration/internal/use-query-options-for-use-suspense-queries'
import { createTreatyUseQueriesProxy } from './use-queries'

export type EdenTreatyUseSuspenseQueries<T extends AnyElysia> = <
  TData extends any[],
  TCombinedResult = SuspenseQueriesResults<TData>,
>(
  queriesCallback: (
    t: EdenTreatyUseSuspenseQueriesProxy<T>,
  ) => readonly [...SuspenseQueriesOptions<TData>],
) => TCombinedResult

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
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? UseSuspenseQueriesHook<TSchema[K], [...TPath, K]>
    : EdenTreatyUseSuspenseQueriesProxyMapping<TSchema[K], [...TPath, K]>
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

export function createTreatyUseSuspenseQueriesProxy<T extends AnyElysia = AnyElysia>(
  client: EdenClient<T>,
  paths: string[] = [],
): EdenTreatyUseSuspenseQueriesProxy<T> {
  return createTreatyUseQueriesProxy(client, paths) as any
}
