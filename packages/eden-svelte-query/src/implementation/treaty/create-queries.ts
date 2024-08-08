import type {
  EdenClient,
  EdenRequestParams,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
} from '@ap0nia/eden'
import type {
  CreateQueryOptions,
  QueriesOptions,
  QueriesResults,
  QueryKey,
  QueryOptions,
} from '@tanstack/svelte-query'
import type { AnyElysia, RouteSchema } from 'elysia'

import type { EdenQueryConfig } from '../../config'
import type { CreateQueryOptionsForCreateQueries } from '../../integration/internal/create-query-options-for-create-queries'
import { parsePathsAndMethod } from '../../integration/internal/parse-paths-and-method'
import type { EdenQueryBaseOptions } from '../../integration/internal/query-base-options'
import { type EdenQueryKey, getQueryKey } from '../../integration/internal/query-key'

/**
 * A function that accepts a callback that's called with a proxy object.
 * Invoking the proxy object returns strongly typed query options.
 */
export type EdenTreatyCreateQueries<T extends AnyElysia> = <
  TData extends any[],
  TCombinedResult = QueriesResults<TData>,
>(
  callback: (t: EdenTreatyCreateQueriesProxy<T>) => readonly [...QueriesOptions<TData>],
) => TCombinedResult

/**
 * A proxy object that returns {@link CreateQueryOptions} (instead of an actual create query result).
 * Passed to `createQueries` caller to use.
 */
export type EdenTreatyCreateQueriesProxy<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatyCreateQueriesProxyMapping<TSchema>
  : 'Please install Elysia before using Eden'

/**
 * Implementation.
 */
export type EdenTreatyCreateQueriesProxyMapping<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? EdenTreatyCreateQueriesHook<TSchema[K], [...TPath, K]>
    : EdenTreatyCreateQueriesProxyMapping<TSchema[K], [...TPath, K]>
}

/**
 * When a route is encountered, it is replaced with a callable function that takes the same inputs.
 */
export type EdenTreatyCreateQueriesHook<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput extends InferRouteOptions<TRoute> = InferRouteOptions<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TKey extends QueryKey = EdenQueryKey<TPath>,
> = (
  input: {} extends TInput ? void | TInput : TInput,
  opts?: CreateQueryOptionsForCreateQueries<TOutput, TInput, TError>,
) => CreateQueryOptions<TOutput, TError, TOutput, TKey>

type CreateQueriesProxyArgs = [InferRouteOptions, (Partial<QueryOptions> & EdenQueryBaseOptions)?]

export function createTreatyCreateQueriesProxy<T extends AnyElysia = AnyElysia>(
  client: EdenClient<T>,
  originalPaths: string[] = [],
  config?: EdenQueryConfig<T>,
): EdenTreatyCreateQueriesProxy<T> {
  const useQueriesProxy = new Proxy(() => {}, {
    get: (_target, path: string, _receiver) => {
      const nextPaths = path === 'index' ? [...originalPaths] : [...originalPaths, path]
      return createTreatyCreateQueriesProxy(client, nextPaths)
    },
    apply: (_target, _thisArg, args: CreateQueriesProxyArgs) => {
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
