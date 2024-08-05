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

import { parsePathsAndMethod } from '../../integration/internal/helpers'
import type { EdenUseQueryBaseOptions } from '../../integration/internal/query-base-options'
import { type EdenQueryKey, getQueryKey } from '../../integration/internal/query-key'
import type { UseQueryOptionsForUseQueries } from '../../integration/internal/use-query-options-for-use-queries'
import type { EdenTreatyQueryConfig } from './config'

/**
 * A function that accepts a callback that's called with a proxy object.
 * Invoking the proxy object returns strongly typed query options.
 */
export type EdenTreatyUseQueries<T extends AnyElysia> = <
  TData extends any[],
  TCombinedResult = QueriesResults<TData>,
>(
  callback: (t: EdenTreatyUseQueriesProxy<T>) => readonly [...QueriesOptions<TData>],
) => TCombinedResult

/**
 * A proxy object that returns {@link CreateQueryOptions} (instead of an actual create query result).
 * Passed to `createQueries` caller to use.
 */
export type EdenTreatyUseQueriesProxy<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatyUseQueriesProxyMapping<TSchema>
  : 'Please install Elysia before using Eden'

/**
 * Implementation.
 */
export type EdenTreatyUseQueriesProxyMapping<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? EdenTreatyUseQueriesHook<TSchema[K], [...TPath, K]>
    : EdenTreatyUseQueriesProxyMapping<TSchema[K], [...TPath, K]>
}

/**
 * When a route is encountered, it is replaced with a callable function that takes the same inputs.
 */
export type EdenTreatyUseQueriesHook<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput extends InferRouteOptions<TRoute> = InferRouteOptions<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TKey extends QueryKey = EdenQueryKey<TPath>,
> = (
  input: {} extends TInput ? void | TInput : TInput,
  opts?: UseQueryOptionsForUseQueries<TOutput, TInput, TError>,
) => UseQueryOptions<TOutput, TError, TOutput, TKey>

type UseQueriesProxyArgs = [InferRouteOptions, (Partial<QueryOptions> & EdenUseQueryBaseOptions)?]

export function createTreatyUseQueriesProxy<T extends AnyElysia = AnyElysia>(
  client: EdenClient<T>,
  originalPaths: string[] = [],
  config?: EdenTreatyQueryConfig<T>,
): EdenTreatyUseQueriesProxy<T> {
  const useQueriesProxy = new Proxy(() => {}, {
    get: (_target, path: string, _receiver) => {
      const nextPaths = path === 'index' ? [...originalPaths] : [...originalPaths, path]
      return createTreatyUseQueriesProxy(client, nextPaths)
    },
    apply: (_target, _thisArg, args: UseQueriesProxyArgs) => {
      const options = args[0]

      const { eden, ...queryOptionsOverrides } = args[1] ?? {}

      const { path, method } = parsePathsAndMethod(originalPaths)

      const queryOptions: QueryOptions = {
        queryKey: getQueryKey(originalPaths, options, 'query'),
        queryFn: async (_context) => {
          const params: EdenRequestParams = {
            ...config,
            ...eden,
            options,
            path,
            method,
            fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
          }

          const result = await client.query(params)

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
