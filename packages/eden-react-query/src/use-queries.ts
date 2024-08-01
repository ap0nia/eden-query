import type {
  EdenClient,
  EdenRequestParams,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
} from '@elysiajs/eden'
import type {
  QueriesOptions,
  QueriesResults,
  QueryKey,
  QueryOptions,
  UseQueryOptions,
} from '@tanstack/react-query'
import type { AnyElysia, RouteSchema } from 'elysia'

import { type EdenQueryKey, getQueryKey } from './query-key'
import type { EdenUseQueryBaseOptions } from './use-query'
import type { DistributiveOmit } from './utils/types'

/**
 * A function that accepts a callback that's called with a proxy object.
 * Invoking the proxy object returns strongly typed query options.
 */
export type EdenUseQueries<T extends AnyElysia> = <
  TData extends any[],
  TCombinedResult = QueriesResults<TData>,
>(
  callback: (t: EdenUseQueriesProxy<T>) => readonly [...QueriesOptions<TData>],
) => TCombinedResult

/**
 * A proxy object that returns {@link CreateQueryOptions} (instead of an actual create query result).
 * Passed to `createQueries` caller to use.
 */
export type EdenUseQueriesProxy<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenUseQueriesProxyMapping<TSchema>
  : 'Please install Elysia before using Eden'

/**
 * Implementation.
 */
export type EdenUseQueriesProxyMapping<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? UseQueriesHook<TSchema[K], [...TPath, K]>
    : EdenUseQueriesProxyMapping<TSchema[K], [...TPath, K]>
}

/**
 * When a route is encountered, it is replaced with a callable function that takes the same inputs.
 */
export type UseQueriesHook<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput extends InferRouteOptions<TRoute> = InferRouteOptions<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TKey extends QueryKey = EdenQueryKey<TPath>,
> = (
  input: TInput,
  opts?: UseQueryOptionsForUseQueries<TOutput, TInput, TError>,
) => UseQueryOptionsForUseQueries<TOutput, TError, TOutput, TKey>

/**
 * @internal
 */
export type UseQueryOptionsForUseQueries<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = DistributiveOmit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey'>

type UseQueriesProxyArgs = [InferRouteOptions, (Partial<QueryOptions> & EdenUseQueryBaseOptions)?]

export function createUseQueriesProxy<T extends AnyElysia = AnyElysia>(
  client: EdenClient<T>,
  paths: string[] = [],
): EdenUseQueriesProxy<T> {
  const useQueriesProxy = new Proxy(() => {}, {
    get: (_target, path: string, _receiver) => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createUseQueriesProxy(client, nextPaths)
    },
    apply: (_target, _thisArg, args: UseQueriesProxyArgs) => {
      const path = '/' + paths.join('/')

      const options = args[0]

      const { eden, ...queryOptionsOverrides } = args[1] ?? {}

      const resolvedParams: EdenRequestParams = { path, options, ...eden }

      const queryOptions: QueryOptions = {
        queryKey: getQueryKey(paths, options, 'query'),
        queryFn: async (_context) => {
          const result = await client.query(resolvedParams)

          if (result.error != null) {
            throw result.error
          }

          return result.data
        },
        ...queryOptionsOverrides,
      }

      return queryOptions
    },
  })

  return useQueriesProxy as any
}
