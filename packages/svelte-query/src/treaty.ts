import {
  type EdenConfig,
  type EdenRequestOptions,
  type EdenRouteBody,
  type EdenRouteError,
  type EdenRouteInput,
  type EdenRouteSuccess,
  type EdenTreaty,
  edenTreaty,
  type EdenWs,
  type ExtractRoutes,
  type FormatParam,
  getPathParam,
  type InternalEdenTypesConfig,
  type InternalElysia,
  type InternalRouteSchema,
  type ParameterFunctionArgs,
  type TypedEdenResolverConfig,
  type WebSocketClientOptions,
} from '@ap0nia/eden'
import { type EdenTreatyTanstackQuery, edenTreatyTanstackQuery } from '@ap0nia/eden-tanstack-query'
import {
  createInfiniteQuery,
  type CreateInfiniteQueryOptions,
  type CreateInfiniteQueryResult,
  createMutation,
  type CreateMutationOptions,
  type CreateMutationResult,
  createQueries,
  createQuery,
  type CreateQueryOptions,
  type CreateQueryResult,
  type InfiniteData,
  type QueriesOptions,
  type QueriesResults,
} from '@tanstack/svelte-query'
import type { Readable } from 'svelte/store'

import type { InfiniteQueryKeys } from './fetch'
import type { EdenSvelteQueryConfig } from './types'

export interface EdenTreatySvelteQueryHooks<
  TElysia extends InternalElysia = {},
  TConfig extends InternalEdenTypesConfig = {},
> {
  createQueries: <T extends any[], TCombinedResult = QueriesResults<T>>(
    callback: (eden: EdenTreatyTanstackQuery<TElysia, TConfig>) => QueriesOptions<T>,
    combine?: (result: QueriesResults<T>) => TCombinedResult,
  ) => Readable<TCombinedResult>

  createQuery: (
    treaty: EdenTreaty<TElysia, TConfig>,
    paths: string[],
    argArray: any[],
  ) => CreateQueryResult

  createInfiniteQuery: (
    treaty: EdenTreaty<TElysia, TConfig>,
    paths: string[],
    argArray: any[],
  ) => CreateInfiniteQueryResult

  createMutation: (
    treaty: EdenTreaty<TElysia, TConfig>,
    paths: string[],
    argArray: any[],
  ) => CreateMutationResult

  createSubscription: (
    treaty: EdenTreaty<TElysia, TConfig>,
    paths: string[],
    argArray: any[],
  ) => EdenWs
}

/**
 * Properties available at the Eden-treaty proxy root.
 * Also double as shared hooks and cached configuration for nested proxies.
 *
 * @internal
 */
export type EdenTreatySvelteQueryRoot<
  TElysia extends InternalElysia = {},
  TConfig extends InternalEdenTypesConfig = {},
> = {
  /**
   * Utility function to update the types configuration.
   */
  types<U extends InternalEdenTypesConfig>(
    types?: U,
  ): EdenTreatySvelteQueryProxy<TElysia, ExtractRoutes<TElysia>, U>

  treaty: EdenTreaty<TElysia, TConfig>

  config(config?: EdenSvelteQueryConfig<TElysia, TConfig>): EdenTreatySvelteQuery<TElysia, TConfig>

  hooks: EdenTreatySvelteQueryHooks<TElysia, TConfig>
}

export type EdenTreatySvelteQueryProxy<
  TElysia extends InternalElysia,
  TRoutes extends Record<string, unknown>,
  TConfig extends InternalEdenTypesConfig = {},
  TPaths extends any[] = [],
  TParams extends string = Extract<keyof TRoutes, `:${string}`>,
  TNormalRoutes extends Record<string, any> = Omit<TRoutes, TParams>,
  TParamsRoutes extends Record<string, any> = Pick<TRoutes, TParams>,
> = EdenTreatySvelteQueryPath<TElysia, TNormalRoutes, TConfig, TPaths> &
  ({} extends TParamsRoutes
    ? {}
    : EdenTreatySvelteQueryPathParam<TElysia, TParamsRoutes, TConfig, TPaths>)

export type EdenTreatySvelteQueryPath<
  TElysia extends InternalElysia,
  TRoutes extends Record<string, any>,
  TConfig extends InternalEdenTypesConfig = {},
  TPaths extends any[] = [],
> = {
  [K in keyof TRoutes]: TRoutes[K] extends InternalRouteSchema
    ? EdenTreatySvelteQueryRoute<TElysia, TRoutes[K], TConfig, [...TPaths, K]>
    : EdenTreatySvelteQueryProxy<TElysia, TRoutes[K], TConfig, [...TPaths, K]>
}
export type EdenTreatySvelteQueryPathParam<
  TElysia extends InternalElysia,
  TRoutes extends Record<string, any>,
  TConfig extends InternalEdenTypesConfig = {},
  TPaths extends any[] = [],
  TSeparator = TConfig['separator'],
> = TSeparator extends string
  ? {
    // prettier-ignore
    [K in keyof TRoutes as FormatParam<K, TSeparator>]: EdenTreatySvelteQueryProxy<TElysia, TRoutes[K], TConfig, [...TPaths, K]>
  }
  : // prettier-ignore
    (args: ParameterFunctionArgs<TRoutes>) => EdenTreatySvelteQueryProxy<TElysia, TRoutes[keyof TRoutes], TConfig, [...TPaths, keyof TRoutes]>

export type EdenTreatySvelteQueryRoute<
  TElysia extends InternalElysia,
  TRoute extends InternalRouteSchema,
  TConfig extends InternalEdenTypesConfig = {},
  TPaths extends any[] = [],
> = TPaths extends [...infer TPathSegments, infer TMethod]
  ? Uppercase<TMethod & string> extends 'GET'
    ? EdenTreatySvelteQueryQueryRoute<TElysia, TRoute, TConfig, TPathSegments>
    : Uppercase<TMethod & string> extends 'SUBSCRIBE'
      ? EdenTreatySubscriptionRoute<TElysia, TRoute, TConfig, TPathSegments>
      : EdenTreatySvelteQueryMutationRoute<TElysia, TRoute, TConfig, TPathSegments>
  : never

export type EdenTreatySvelteQueryQueryRoute<
  TElysia extends InternalElysia,
  TRoute extends InternalRouteSchema,
  TConfig extends InternalEdenTypesConfig = {},
  TPaths extends any[] = [],
  TOptions = EdenRouteInput<TRoute>,
  TFinalOptions = TConfig['separator'] extends string
    ? TOptions
    : Omit<TOptions, 'params'> & { params?: Record<string, any> },
> = {
  createQuery: (
    ...args: [
      ...({} extends TFinalOptions
        ? [
            options?: TFinalOptions,
            config?: Partial<
              CreateQueryOptions<
                EdenRouteSuccess<TRoute>,
                EdenRouteError<TRoute>,
                EdenRouteSuccess<TRoute>,
                [TPaths, { options: EdenRouteInput; type: 'query' }]
              >
            > & {
              eden?: TypedEdenResolverConfig<TElysia, TConfig>
            },
          ]
        : [
            options: TFinalOptions,
            config?: Partial<
              CreateQueryOptions<
                EdenRouteSuccess<TRoute>,
                EdenRouteError<TRoute>,
                EdenRouteSuccess<TRoute>,
                [TPaths, { options: EdenRouteInput; type: 'query' }]
              >
            > & {
              eden?: TypedEdenResolverConfig<TElysia, TConfig>
            },
          ]),
    ]
  ) => CreateQueryResult<EdenRouteSuccess<TRoute>, EdenRouteError<TRoute>>
} & (TOptions extends { query?: infer TQuery }
  ? NonNullable<keyof TQuery> extends InfiniteQueryKeys
    ? EdenTreatySvelteQueryInfiniteQueryRoute<TElysia, TRoute, TConfig, TPaths>
    : {}
  : {})

export type EdenTreatySvelteQueryInfiniteQueryRoute<
  TElysia extends InternalElysia,
  TRoute extends InternalRouteSchema,
  TConfig extends InternalEdenTypesConfig = {},
  TPaths extends any[] = [],
  TOptions = EdenRouteInput<TRoute>,
  TFinalOptions = TConfig['separator'] extends string
    ? TOptions
    : Omit<TOptions, 'params'> & { params?: Record<string, any> },
> = {
  createInfiniteQuery: (
    options: TFinalOptions,
    config: Omit<
      CreateInfiniteQueryOptions<
        EdenRouteSuccess<TRoute>,
        EdenRouteError<TRoute>,
        EdenRouteSuccess<TRoute>,
        [TPaths, { options: EdenRouteInput; type: 'query' }],
        TOptions extends { query?: { cursor?: any } }
          ? NonNullable<TOptions['query']>['cursor']
          : never
      >,
      'queryKey'
    > & {
      eden?: TypedEdenResolverConfig<TElysia, TConfig>
    },
  ) => CreateInfiniteQueryResult<InfiniteData<EdenRouteSuccess<TRoute>>, EdenRouteError<TRoute>>
}

export type EdenTreatySvelteQueryMutationRoute<
  TElysia extends InternalElysia,
  TRoute extends InternalRouteSchema,
  TConfig extends InternalEdenTypesConfig = {},
  _TPaths extends any[] = [],
  TBody = EdenRouteBody<TRoute>,
  TOptions = EdenRouteInput<TRoute>,
  TFinalOptions = TConfig['separator'] extends string
    ? TOptions
    : Omit<TOptions, 'params'> & { params?: Record<string, any> },
> = {
  createMutation: <TContext = unknown>(
    ...args: [
      ...({} extends TFinalOptions
        ? [
            options?: TFinalOptions,
            config?: Partial<
              CreateMutationOptions<
                EdenRouteSuccess<TRoute>,
                EdenRouteError<TRoute>,
                TBody,
                TContext
              >
            > & {
              eden?: TypedEdenResolverConfig<TElysia, TConfig>
            },
          ]
        : [
            options: TFinalOptions,
            config?: Partial<
              CreateMutationOptions<
                EdenRouteSuccess<TRoute>,
                EdenRouteError<TRoute>,
                TBody,
                TContext
              >
            > & {
              eden?: TypedEdenResolverConfig<TElysia, TConfig>
            },
          ]),
    ]
  ) => CreateMutationResult<EdenRouteSuccess<TRoute>, EdenRouteError<TRoute>, TBody, TContext>
}

export type EdenTreatySubscriptionRoute<
  _TElysia extends InternalElysia,
  TRoute extends InternalRouteSchema,
  TConfig extends InternalEdenTypesConfig = {},
  _TPaths extends any[] = [],
  TOptions = EdenRouteInput<TRoute>,
  TFinalOptions = TConfig['separator'] extends string
    ? TOptions
    : Omit<TOptions, 'params'> & { params?: Record<string, any> },
> = (
  ...args: [
    ...({} extends TFinalOptions ? [options?: TFinalOptions] : [options: TFinalOptions]),
    clientOptions?: Partial<WebSocketClientOptions>,
  ]
) => EdenWs<TRoute>

/**
 * @public
 */
export type EdenTreatySvelteQuery<
  TElysia extends InternalElysia = InternalElysia,
  TConfig extends InternalEdenTypesConfig = {},
> = EdenTreatySvelteQueryRoot<TElysia> &
  EdenTreatySvelteQueryProxy<TElysia, ExtractRoutes<TElysia>, TConfig>

function edenTreatySvelteQueryProxy<
  TElysia extends InternalElysia = any,
  TConfig extends InternalEdenTypesConfig = any,
>(
  root: EdenTreatySvelteQueryRoot<TElysia, TConfig>,
  config?: EdenConfig<TElysia, TConfig>,
  paths: string[] = [],
  pathParams: Record<string, any>[] = [],
) {
  const proxy: any = new Proxy(() => {}, {
    get(_target, p: string, _receiver) {
      const newPaths = [...paths]

      if (p !== 'index') newPaths.push(p)

      const nextRoot = { ...root }

      const isHook = Object.prototype.hasOwnProperty.call(root.hooks, p)

      if (!isHook) nextRoot.treaty = nextRoot.treaty[p as never]

      return edenTreatySvelteQueryProxy(nextRoot, config, newPaths, pathParams)
    },
    apply(_target, _thisArg, argArray) {
      const pathsCopy = [...paths]

      const hook = pathsCopy.pop()

      const pathParam = getPathParam(argArray)

      const isHook = hook && Object.prototype.hasOwnProperty.call(root.hooks, hook)

      if (pathParam?.key != null && !isHook) {
        const allPathParams = [...pathParams, pathParam.param]

        const pathsWithParams = [...paths, `:${pathParam.key}`]

        const nextRoot = { ...root, treaty: (root.treaty as any)(...argArray) }

        return edenTreatySvelteQueryProxy(nextRoot, config, pathsWithParams, allPathParams)
      }

      if (!isHook) {
        throw new Error(`Unknown hook: ${hook}`)
      }

      return root.hooks[hook as 'createQuery'](root.treaty, pathsCopy, argArray)
    },
  })

  return proxy
}

export function edenTreatySvelteQuery<
  TElysia extends InternalElysia,
  const TConfig extends InternalEdenTypesConfig = {},
>(
  domain?: string,
  config: EdenSvelteQueryConfig<TElysia, TConfig> = {},
): EdenTreatySvelteQuery<TElysia, TConfig> {
  const tanstack = edenTreatyTanstackQuery(domain, config)

  const hooks: EdenTreatySvelteQueryHooks<TElysia, TConfig> = {
    createQueries: (callback, options) => {
      const queries = callback(tanstack)
      return createQueries({ queries, ...options })
    },
    createQuery: (treaty, paths, argArray) => {
      const { eden, ...userOptions } = argArray[1] ?? {}

      const baseQueryOptions = tanstack.hooks.queryOptions(treaty, paths, [argArray[0], eden])

      const queryOptions = { ...baseQueryOptions, ...userOptions }

      const query = createQuery(queryOptions)

      return query
    },
    createInfiniteQuery: (treaty, paths, argArray) => {
      const [options, userOptionsAndEden = {}] = argArray as [EdenRequestOptions, any]

      const { eden, ...userOptions } = userOptionsAndEden

      const baseQueryOptions = tanstack.hooks.infiniteQueryOptions(treaty, paths, [options, eden])

      const infiniteQueryOptions = { ...baseQueryOptions, ...userOptions }

      const infiniteQuery = createInfiniteQuery(infiniteQueryOptions)

      return infiniteQuery
    },
    createMutation: (treaty, paths, argArray) => {
      const { eden, ...userOptions } = argArray[1] ?? {}

      const baseMutationOptions = tanstack.hooks.mutationOptions(treaty, paths, [argArray[0], eden])

      const mutationOptions = { ...baseMutationOptions, ...userOptions }

      const mutation = createMutation<unknown, Error, unknown, unknown>(mutationOptions)

      return mutation
    },
    createSubscription: (treaty, paths, argArray) => {
      const edenWs = tanstack.hooks.subscribe(treaty, paths, argArray)
      return edenWs
    },
  }

  const root: EdenTreatySvelteQueryRoot<TElysia, TConfig> = {
    types: (types) => edenTreatySvelteQuery(domain, { ...config, types } as any) as any,
    config: (newConfig) => edenTreatySvelteQuery(domain, { ...config, ...newConfig }) as any,
    treaty: edenTreaty(domain, config),
    hooks,
  }

  const innerProxy = edenTreatySvelteQueryProxy(root, { domain, ...config })

  const proxy: any = new Proxy(() => {}, {
    get(_target, p, _receiver) {
      return root[p as never] ?? innerProxy[p]
    },
  })

  return proxy
}
