import {
  type EdenClient,
  type EdenRequestParams,
  type EmptyToVoid,
  type ExtractEdenTreatyRouteParams,
  type ExtractEdenTreatyRouteParamsInput,
  getPathParam,
  type InferRouteError,
  type InferRouteOptions,
  type InferRouteOutput,
  parsePathsAndMethod,
} from '@ap0nia/eden'
import type {
  QueriesOptions,
  QueriesResults,
  QueryKey,
  QueryOptions,
  UseQueryOptions,
} from '@tanstack/react-query'
import type { AnyElysia, RouteSchema } from 'elysia'

import type { EdenQueryConfig } from '../../config'
import type { EdenQueryBaseOptions } from '../../integration/internal/query-base-options'
import { type EdenQueryKey, getQueryKey } from '../../integration/internal/query-key'
import type { UseQueryOptionsForUseQueries } from '../../integration/internal/use-query-options-for-use-queries'

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
  TRouteParams = ExtractEdenTreatyRouteParams<TSchema>,
> = {
  [K in Exclude<keyof TSchema, keyof TRouteParams>]: TSchema[K] extends RouteSchema
    ? EdenTreatyUseQueriesHook<TSchema[K], [...TPath, K]>
    : EdenTreatyUseQueriesProxyMapping<TSchema[K], [...TPath, K]>
} & ({} extends TRouteParams
  ? {}
  : (
      params: ExtractEdenTreatyRouteParamsInput<TRouteParams>,
    ) => EdenTreatyUseQueriesProxyMapping<
      TSchema[Extract<keyof TRouteParams, keyof TSchema>],
      TPath
    >)

/**
 * When a route is encountered, it is replaced with a callable function that takes the same inputs.
 */
export type EdenTreatyUseQueriesHook<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>['query'],
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TKey extends QueryKey = EdenQueryKey<TPath>,
> = (
  input: EmptyToVoid<TInput>,
  opts?: UseQueryOptionsForUseQueries<TOutput, TInput, TError>,
) => UseQueryOptions<TOutput, TError, TOutput, TKey>

type UseQueriesProxyArgs = [InferRouteOptions, (Partial<QueryOptions> & EdenQueryBaseOptions)?]

export function createTreatyUseQueriesProxy<T extends AnyElysia = AnyElysia>(
  client: EdenClient<T>,
  originalPaths: string[] = [],
  config?: EdenQueryConfig<T>,
  pathParams: Record<string, any>[] = [],
): EdenTreatyUseQueriesProxy<T> {
  const useQueriesProxy = new Proxy(() => {}, {
    get: (_target, path: string, _receiver) => {
      const nextPaths = path === 'index' ? [...originalPaths] : [...originalPaths, path]
      return createTreatyUseQueriesProxy(client, nextPaths, config, pathParams)
    },
    apply: (_target, _thisArg, args: UseQueriesProxyArgs) => {
      const pathParam = getPathParam(args)

      if (pathParam?.key != null) {
        const allPathParams = [...pathParams, pathParam.param]
        const pathsWithParams = [...originalPaths, `:${pathParam.key}`]
        return createTreatyUseQueriesProxy(client, pathsWithParams, config, allPathParams)
      }

      const query = args[0]

      const params: Record<string, any> = {}

      for (const param of pathParams) {
        for (const key in param) {
          params[key] = param[key]
        }
      }

      const options = { query, params }

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
