import {
  type EdenConfig,
  type EdenRequestOptions,
  type EdenResult,
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
  HTTP_METHODS,
  type InternalEdenTypesConfig,
  type InternalElysia,
  type InternalRouteSchema,
  linkAbortSignals,
  type ParameterFunctionArgs,
  type TypedEdenResolverConfig,
  type WebSocketClientOptions,
} from '@ap0nia/eden'
import type { DataTag } from '@tanstack/query-core'

import type { EdenMutationOptions, EdenQueryOptions, EdenTanstackQueryConfig } from './shared'

export interface EdenTreatyTanstackQueryHooks<
  TElysia extends InternalElysia = {},
  TConfig extends InternalEdenTypesConfig = {},
> {
  queryOptions: (
    treaty: EdenTreaty<TElysia, TConfig>,
    paths: string[],
    argArray: any[],
  ) => EdenQueryOptions

  infiniteQueryOptions: (
    treaty: EdenTreaty<TElysia, TConfig>,
    paths: string[],
    argArray: any[],
  ) => EdenQueryOptions

  mutationOptions: (
    treaty: EdenTreaty<TElysia, TConfig>,
    paths: string[],
    argArray: any[],
  ) => EdenMutationOptions

  subscribe: (treaty: EdenTreaty<TElysia, TConfig>, paths: string[], argArray: any[]) => EdenWs
}

/**
 * Properties available at the Eden-treaty proxy root.
 * Also double as shared hooks and cached configuration for nested proxies.
 *
 * @internal
 */
export type EdenTreatyTanstackQueryRoot<
  TElysia extends InternalElysia = {},
  TConfig extends InternalEdenTypesConfig = {},
> = {
  /**
   * Utility function to update the types configuration.
   */
  types<U extends InternalEdenTypesConfig>(
    types?: U,
  ): EdenTreatyTanstackQueryProxy<TElysia, ExtractRoutes<TElysia>, U>

  treaty: EdenTreaty<TElysia, TConfig>

  hooks: EdenTreatyTanstackQueryHooks<TElysia, TConfig>
}

export type EdenTreatyTanstackQueryProxy<
  TElysia extends InternalElysia,
  TRoutes extends Record<string, unknown>,
  TConfig extends InternalEdenTypesConfig = {},
  TPaths extends any[] = [],
  TParams extends string = Extract<keyof TRoutes, `:${string}`>,
  TNormalRoutes extends Record<string, any> = Omit<TRoutes, TParams>,
  TParamsRoutes extends Record<string, any> = Pick<TRoutes, TParams>,
> = EdenTreatyTanstackQueryPath<TElysia, TNormalRoutes, TConfig, TPaths> &
  ({} extends TParamsRoutes
    ? {}
    : EdenTreatyTanstackQueryPathParam<TElysia, TParamsRoutes, TConfig, TPaths>)

export type EdenTreatyTanstackQueryPath<
  TElysia extends InternalElysia,
  TRoutes extends Record<string, any>,
  TConfig extends InternalEdenTypesConfig = {},
  TPaths extends any[] = [],
> = {
  [K in keyof TRoutes]: TRoutes[K] extends InternalRouteSchema
    ? EdenTreatyTanstackQueryRoute<TElysia, TRoutes[K], TConfig, [...TPaths, K]>
    : EdenTreatyTanstackQueryProxy<TElysia, TRoutes[K], TConfig, [...TPaths, K]>
}
export type EdenTreatyTanstackQueryPathParam<
  TElysia extends InternalElysia,
  TRoutes extends Record<string, any>,
  TConfig extends InternalEdenTypesConfig = {},
  TPaths extends any[] = [],
  TSeparator = TConfig['separator'],
> = TSeparator extends string
  ? {
    // prettier-ignore
    [K in keyof TRoutes as FormatParam<K, TSeparator>]: EdenTreatyTanstackQueryProxy<TElysia, TRoutes[K], TConfig, [...TPaths, K]>
  }
  : // prettier-ignore
    (args: ParameterFunctionArgs<TRoutes>) => EdenTreatyTanstackQueryProxy<TElysia, TRoutes[keyof TRoutes], TConfig, [...TPaths, keyof TRoutes]>

export type EdenTreatyTanstackQueryRoute<
  TElysia extends InternalElysia,
  TRoute extends InternalRouteSchema,
  TConfig extends InternalEdenTypesConfig = {},
  TPaths extends any[] = [],
> = TPaths extends [...infer TPathSegments, infer TMethod]
  ? Uppercase<TMethod & string> extends 'GET'
    ? EdenTreatyTanstackQueryQueryRoute<TElysia, TRoute, TConfig, TPathSegments>
    : Uppercase<TMethod & string> extends 'SUBSCRIBE'
      ? EdenTreatySubscriptionRoute<TElysia, TRoute, TConfig, TPathSegments>
      : EdenTreatyTanstackQueryMutationRoute<TElysia, TRoute, TConfig, TPathSegments>
  : never

export type EdenTreatyTanstackQueryQueryRoute<
  TElysia extends InternalElysia,
  TRoute extends InternalRouteSchema,
  TConfig extends InternalEdenTypesConfig = {},
  TPaths extends any[] = [],
  TOptions = EdenRouteInput<TRoute>,
  TFinalOptions = TConfig['separator'] extends string
    ? TOptions
    : Omit<TOptions, 'params'> & { params?: Record<string, any> },
> = {
  queryOptions: (
    ...args: [
      ...({} extends TFinalOptions
        ? [options?: TFinalOptions, config?: TypedEdenResolverConfig<TElysia, TConfig>]
        : [options: TFinalOptions, config?: TypedEdenResolverConfig<TElysia, TConfig>]),
    ]
  ) => EdenQueryOptions<
    EdenRouteSuccess<TRoute>,
    EdenRouteError<TRoute>,
    EdenRouteSuccess<TRoute>,
    DataTag<
      [TPaths, { options: EdenRouteInput; type: 'query' }],
      EdenRouteSuccess<TRoute>,
      EdenRouteSuccess<TRoute>
    >,
    TOptions extends { query?: { cursor?: any } } ? NonNullable<TOptions['query']>['cursor'] : never
  >
}

export type EdenTreatyTanstackQueryMutationRoute<
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
  mutationOptions: <TContext = unknown>(
    ...args: [
      ...({} extends TFinalOptions
        ? [options?: TFinalOptions, config?: TypedEdenResolverConfig<TElysia, TConfig>]
        : [options: TFinalOptions, config?: TypedEdenResolverConfig<TElysia, TConfig>]),
    ]
  ) => EdenMutationOptions<EdenRouteSuccess<TRoute>, EdenRouteError<TRoute>, TBody, TContext>
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
> = {
  subscribe: (
    ...args: [
      ...({} extends TFinalOptions
        ? [options?: TFinalOptions, clientOptions?: Partial<WebSocketClientOptions>]
        : [options: TFinalOptions, clientOptions?: Partial<WebSocketClientOptions>]),
    ]
  ) => EdenWs<TRoute>
}

/**
 * @public
 */
export type EdenTreatyTanstackQuery<
  TElysia extends InternalElysia = InternalElysia,
  TConfig extends InternalEdenTypesConfig = {},
> = EdenTreatyTanstackQueryRoot<TElysia, TConfig> &
  EdenTreatyTanstackQueryProxy<TElysia, ExtractRoutes<TElysia>, TConfig>

export function edenTreatyTanstackQueryProxy<
  TElysia extends InternalElysia = any,
  TConfig extends InternalEdenTypesConfig = any,
>(
  root: EdenTreatyTanstackQueryRoot<TElysia, TConfig>,
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

      return edenTreatyTanstackQueryProxy(nextRoot, config, newPaths, pathParams)
    },
    apply(_target, _thisArg, argArray) {
      const pathsCopy = [...paths]

      const hook = pathsCopy.pop()

      const pathParam = getPathParam(argArray)

      const isHook = hook && Object.prototype.hasOwnProperty.call(root.hooks, hook)

      if (pathParam?.key != null && !isHook) {
        const allPathParams = [...pathParams, pathParam.param]

        const pathsWithParams = [...paths, `:${pathParam.key}`]

        const nextRoot = { ...root }

        nextRoot.treaty = (nextRoot.treaty as any)(...argArray)

        return edenTreatyTanstackQueryProxy(nextRoot, config, pathsWithParams, allPathParams)
      }

      if (!isHook) {
        throw new Error(`Unknown hook: ${hook}`)
      }

      let options = argArray[0] as EdenRequestOptions | undefined

      const configOrWsOptions = argArray[1] as
        | TypedEdenResolverConfig
        | Partial<WebSocketClientOptions>

      const paramEntries = pathParams.flatMap((p) => Object.entries(p))

      if (paramEntries.length) {
        const params = Object.fromEntries(paramEntries)

        options = {
          ...options,
          input: {
            ...options?.input,
            params: {
              ...options?.input?.params,
              ...params,
            },
          },
        }
      }

      const resolvedArgs = [options, configOrWsOptions]

      return root.hooks[hook as keyof typeof root.hooks](root.treaty, pathsCopy, resolvedArgs)
    },
  })

  return proxy
}

export function edenTreatyTanstackQuery<
  TElysia extends InternalElysia,
  const TConfig extends InternalEdenTypesConfig = {},
>(
  domain?: string,
  config: EdenTanstackQueryConfig<TElysia, TConfig> = {},
): EdenTreatyTanstackQuery<TElysia, TConfig> {
  const hooks: EdenTreatyTanstackQueryHooks<TElysia, TConfig> = {
    queryOptions: (treaty, paths, argArray) => {
      const [options, conf] = argArray as [EdenRouteInput, TypedEdenResolverConfig]

      const resolvedConfig = { ...config, ...conf }

      const pathsNoMethod = [...paths]

      const maybeMethod = paths.at(-1)?.toUpperCase()

      if (HTTP_METHODS.includes(maybeMethod as any)) pathsNoMethod.pop()

      const cacheSettings: any = { type: 'query' }

      if (options) {
        cacheSettings.options = options
      }

      const queryKey = [pathsNoMethod, cacheSettings]

      const queryOptions: EdenQueryOptions = {
        queryKey,
        queryFn: async (context) => {
          const resolvedOptions = { ...options }

          if (resolvedConfig.abortOnUnmount) {
            const signal = linkAbortSignals(context.signal, resolvedConfig.fetch?.signal)
            resolvedConfig.fetch = { ...resolvedConfig.fetch, signal }
          }

          if (context.pageParam) {
            if (Object.prototype.hasOwnProperty.call(resolvedOptions.query, 'cursor')) {
              resolvedOptions.query = { ...resolvedOptions.query, cursor: context.pageParam as any }
            }

            if (Object.prototype.hasOwnProperty.call(resolvedOptions.params, 'cursor')) {
              resolvedOptions.params = {
                ...resolvedOptions.params,
                cursor: context.pageParam as any,
              }
            }
          }

          const result: EdenResult = await (treaty as any)(resolvedOptions, resolvedConfig)

          return result.data
        },
      }

      return queryOptions
    },
    infiniteQueryOptions(treaty, paths, argArray) {
      const queryOptions = this.queryOptions(treaty, paths, argArray)

      const [options] = argArray as [EdenRequestOptions, TypedEdenResolverConfig]

      const cacheSettings: any = { type: 'infiniteQuery' }

      if (options) {
        cacheSettings.options = options
      }

      const queryKey = [queryOptions.queryKey[0], cacheSettings]

      const infiniteQueryOptions = { ...queryOptions, queryKey }

      return infiniteQueryOptions as any
    },
    mutationOptions: (treaty, paths, argArray) => {
      const [options, conf] = argArray as [EdenRequestOptions, TypedEdenResolverConfig]

      const resolvedConfig = { ...config, ...conf }

      const cacheSettings: any = { type: 'mutation' }

      if (options) {
        cacheSettings.options = options
      }

      const mutationKey = [paths, cacheSettings]

      const mutationOptions: EdenMutationOptions = {
        mutationKey,
        mutationFn: async (body) => {
          const result: EdenResult = await (treaty as any)(body, options, resolvedConfig)
          return result.data
        },
      }

      return mutationOptions
    },
    subscribe: (treaty, _paths, argArray) => {
      const [options, wsOptions] = argArray as [EdenRequestOptions, WebSocketClientOptions]

      const edenWs = (treaty as any)(options, wsOptions)

      return edenWs
    },
  }

  const root: EdenTreatyTanstackQueryRoot<TElysia, TConfig> = {
    types: (types) => edenTreatyTanstackQuery(domain, { ...config, types } as any) as any,
    treaty: edenTreaty(domain, config),
    hooks,
  }

  const innerProxy = edenTreatyTanstackQueryProxy(root, { domain, ...config } as any)

  const proxy: any = new Proxy(() => {}, {
    get(_target, p, _receiver) {
      return root[p as never] ?? innerProxy[p]
    },
  })

  return proxy
}
