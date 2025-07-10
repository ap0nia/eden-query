import {
  type EdenFetch,
  edenFetch,
  type EdenFetchOptions,
  type EdenRequestOptions,
  type EdenResult,
  type EdenRouteBody,
  type EdenRouteError,
  type EdenRouteSuccess,
  type ExtendedEdenRouteOptions,
  type ExtractRoutes,
  type FormatParam,
  type InternalEdenTypesConfig,
  type InternalElysia,
  type InternalRouteSchema,
  type IsAny,
  type Join,
  linkAbortSignals,
  type Split,
  type TypedEdenResolverConfig,
  type UnionToIntersection,
} from '@ap0nia/eden'
import type { MutationOptions } from '@tanstack/query-core'

import type {
  EdenMutationOptions,
  EdenQueryOptions,
  EdenTanstackQueryConfig,
  QueryMethod,
} from './shared'

export type EdenFetchTanstackQueryRoot<
  TElysia extends InternalElysia = {},
  TConfig extends InternalEdenTypesConfig = { separator: ':param' },
  TEndpoints = EdenFetchEndpoints<TElysia, ExtractRoutes<TElysia>, TConfig>,
  TQueryEndpoints = {
    [K in keyof TEndpoints as 'get' extends keyof TEndpoints[K] ? K : never]: Pick<
      TEndpoints[K],
      Extract<'get', keyof TEndpoints[K]>
    >
  },
  TMutationEndpoints = {
    [K in keyof TEndpoints as Exclude<keyof TEndpoints[K], QueryMethod> extends never
      ? never
      : K]: Omit<TEndpoints[K], QueryMethod>
  },
> = {
  /**
   * Utility function to update the types configuration.
   */
  types<U extends InternalEdenTypesConfig>(types?: U): EdenFetchTanstackQuery<TElysia, U>

  queryOptions: /**
   * @template TMethod The uppercase HTTP method.
   *   IMPORTANT: will not work with mixed-case custom methods.
   *   Eden-Fetch will attempt to find a matching route with either the fully uppercase or lowercase HTTP method.
   *
   *   @see https://elysiajs.com/essential/route.html#custom-method
   *
   *   BAD - mixed-case: app.route('M-search', '/m-search', 'connect')
   *   OK - uppercase: app.route('M-SEARCH', '/m-search', 'connect')
   *   OK - lowercase: app.route('m-search', '/m-search', 'connect')
   */
  <
    TPath extends keyof TQueryEndpoints,
    TEndpoint extends TQueryEndpoints[TPath],
    TMethod extends Uppercase<keyof TEndpoint & string> | undefined,
    TRoute extends InternalRouteSchema = Extract<
      TEndpoint[Extract<
        undefined extends TMethod ? 'GET' | 'get' : TMethod | Lowercase<TMethod & string>,
        keyof TEndpoint
      >],
      InternalRouteSchema
    >,
    TOptions = EdenFetchOptions<TMethod, TRoute>,
  >(
    path: TPath,
    ...args: [
      ...({} extends TOptions
        ? [
            options?: EdenFetchOptions<TMethod, TRoute>,
            config?: TypedEdenResolverConfig<TElysia, TConfig>,
          ]
        : [
            options: EdenFetchOptions<TMethod, TRoute>,
            config?: TypedEdenResolverConfig<TElysia, TConfig>,
          ]),
    ]
  ) => EdenQueryOptions<
    EdenRouteSuccess<TRoute>,
    EdenRouteError<TRoute>,
    EdenRouteSuccess<TRoute>,
    [Split<TEndpoint>, { options: ExtendedEdenRouteOptions; type: 'query' }],
    TOptions extends { query: { cursor?: any } } ? TOptions['query']['cursor'] : never
  >

  infiniteQueryOptions: /**
   * @template TMethod The uppercase HTTP method.
   *   IMPORTANT: will not work with mixed-case custom methods.
   *   Eden-Fetch will attempt to find a matching route with either the fully uppercase or lowercase HTTP method.
   *
   *   @see https://elysiajs.com/essential/route.html#custom-method
   *
   *   BAD - mixed-case: app.route('M-search', '/m-search', 'connect')
   *   OK - uppercase: app.route('M-SEARCH', '/m-search', 'connect')
   *   OK - lowercase: app.route('m-search', '/m-search', 'connect')
   */
  <
    TPath extends keyof TQueryEndpoints,
    TEndpoint extends TQueryEndpoints[TPath],
    TMethod extends Uppercase<keyof TEndpoint & string> | undefined,
    TRoute extends InternalRouteSchema = Extract<
      TEndpoint[Extract<
        undefined extends TMethod ? 'GET' | 'get' : TMethod | Lowercase<TMethod & string>,
        keyof TEndpoint
      >],
      InternalRouteSchema
    >,
    TOptions = EdenFetchOptions<TMethod, TRoute>,
  >(
    path: TPath,
    ...args: [
      ...({} extends TOptions
        ? [
            options?: EdenFetchOptions<TMethod, TRoute>,
            config?: TypedEdenResolverConfig<TElysia, TConfig>,
          ]
        : [
            options: EdenFetchOptions<TMethod, TRoute>,
            config?: TypedEdenResolverConfig<TElysia, TConfig>,
          ]),
    ]
  ) => EdenQueryOptions<
    EdenRouteSuccess<TRoute>,
    EdenRouteError<TRoute>,
    EdenRouteSuccess<TRoute>,
    [Split<TEndpoint>, { options: ExtendedEdenRouteOptions; type: 'infinite-query' }],
    TOptions extends { query: { cursor?: any } } ? TOptions['query']['cursor'] : never
  >

  mutationOptions: /**
   * @template TMethod The uppercase HTTP method.
   *   IMPORTANT: will not work with mixed-case custom methods.
   *   Eden-Fetch will attempt to find a matching route with either the fully uppercase or lowercase HTTP method.
   *
   *   @see https://elysiajs.com/essential/route.html#custom-method
   *
   *   BAD - mixed-case: app.route('M-search', '/m-search', 'connect')
   *   OK - uppercase: app.route('M-SEARCH', '/m-search', 'connect')
   *   OK - lowercase: app.route('m-search', '/m-search', 'connect')
   */
  <
    TContext,
    TPath extends keyof TMutationEndpoints,
    TEndpoint extends TMutationEndpoints[TPath],
    TMethod extends Uppercase<keyof TEndpoint & string> | undefined,
    TRoute extends InternalRouteSchema = Extract<
      TEndpoint[Extract<
        undefined extends TMethod ? 'GET' | 'get' : TMethod | Lowercase<TMethod & string>,
        keyof TEndpoint
      >],
      InternalRouteSchema
    >,
    TOptions = Omit<EdenFetchOptions<TMethod, TRoute>, 'body'>,
    TBody = EdenRouteBody<TRoute>,
  >(
    path: TPath,
    ...args: [
      ...({} extends TOptions
        ? [
            options?: Omit<EdenFetchOptions<TMethod, TRoute>, 'body'>,
            mutationOptions?: MutationOptions<
              EdenRouteSuccess<TRoute>,
              EdenRouteError<TRoute>,
              TBody,
              TContext
            >,
          ]
        : [
            options: Omit<EdenFetchOptions<TMethod, TRoute>, 'body'>,
            mutationOptions?: MutationOptions<
              EdenRouteSuccess<TRoute>,
              EdenRouteError<TRoute>,
              TBody,
              TContext
            >,
          ]),
    ]
  ) => EdenMutationOptions<EdenRouteSuccess<TRoute>, EdenRouteError<TRoute>, TBody, TContext>
}
/**
 * Properties available at the Eden-treaty proxy root.
 * Also double as shared hooks and cached configuration for nested proxies.
 *
 * @internal
 */
export type EdenFetchTanstackQuery<
  TElysia extends InternalElysia = {},
  TConfig extends InternalEdenTypesConfig = { separator: ':param' },
  TEndpoints = EdenFetchEndpoints<TElysia, ExtractRoutes<TElysia>, TConfig>,
> = EdenFetchTanstackQueryRoot<TElysia, TConfig, TEndpoints> & EdenFetch<TElysia, TConfig>

export type EdenFetchEndpoints<
  TElysia extends InternalElysia,
  TRoutes,
  TConfig extends InternalEdenTypesConfig = {},
  TPaths extends any[] = [],
> =
  IsAny<TRoutes> extends true
    ? {}
    : UnionToIntersection<EdenFetchDistinctEndpoints<TElysia, TRoutes, TConfig, TPaths>>

export type EdenFetchDistinctEndpoints<
  TElysia extends InternalElysia,
  TRoutes,
  TConfig extends InternalEdenTypesConfig = {},
  TPaths extends any[] = [],
> = {
  [K in keyof TRoutes]: TRoutes[K] extends InternalRouteSchema
    ? Record<Join<TPaths>, Record<K, TRoutes[K]>>
    : EdenFetchEndpoints<
        TElysia,
        TRoutes[K],
        TConfig,
        [...TPaths, K extends `:${string}` ? FormatParam<K, TConfig['separator']> : K]
      >
}[keyof TRoutes]

export function edenFetchTanstackQuery<
  TElysia extends InternalElysia,
  const TConfig extends InternalEdenTypesConfig = { separator: ':param' },
>(
  domain?: string,
  config: EdenTanstackQueryConfig<TElysia, TConfig> = {},
): EdenFetchTanstackQuery<TElysia, TConfig> {
  const fetch = edenFetch(domain, config)

  const root = {
    types: (types) => {
      return edenFetchTanstackQuery(domain, { ...config, types } as any) as any
    },
    queryOptions: (...argArray: any[]) => {
      const [path, options] = argArray as [string, EdenRequestOptions, TypedEdenResolverConfig]

      const paths = path
        .split('/')
        .filter((p) => p !== 'index')
        .filter(Boolean)

      const cacheSettings: any = { type: 'query' }

      if (options) {
        cacheSettings.options = options
      }

      const queryKey = [paths, cacheSettings]

      const queryOptions: EdenQueryOptions = {
        queryKey,
        queryFn: async (context) => {
          const resolvedOptions: EdenRequestOptions = { ...options }

          if (config.abortOnUnmount) {
            const signal = linkAbortSignals(context.signal, resolvedOptions.fetch?.signal)
            resolvedOptions.fetch = { ...resolvedOptions.fetch, signal }
          }

          const result: EdenResult = await (fetch as any)(path, resolvedOptions)

          return result.data
        },
      }

      return queryOptions as any
    },
    infiniteQueryOptions(...argArray: any[]) {
      const [path, options] = argArray as [string, EdenRequestOptions, TypedEdenResolverConfig]

      const paths = path
        .split('/')
        .filter((p) => p !== 'index')
        .filter(Boolean)

      const cacheSettings: any = { type: 'infinite-query' }

      if (options) {
        cacheSettings.options = options
      }

      const queryKey = [paths, cacheSettings]

      const queryOptions = this.queryOptions(...(argArray as [any, any]))

      const infiniteQueryOptions = { ...queryOptions, queryKey }

      return infiniteQueryOptions as any
    },
    mutationOptions: (...argArray: any[]) => {
      const [path, options] = argArray as [string, EdenRequestOptions]

      const paths = path.split('/').filter((p) => p !== 'index')

      const cacheSettings: any = { type: 'mutation' }

      if (options) {
        cacheSettings.options = options
      }

      const mutationKey = [paths, cacheSettings]

      const mutationOptions: EdenMutationOptions = {
        mutationKey,
        mutationFn: async (body) => {
          const optionsWithBody = { ...options, body }

          const result: EdenResult = await (fetch as any)(path, optionsWithBody)

          return result.data
        },
      }

      return mutationOptions as any
    },
  } satisfies EdenFetchTanstackQueryRoot<TElysia, TConfig>

  const proxy: any = new Proxy(fetch as any, {
    get(_target, p, _receiver) {
      if (Object.prototype.hasOwnProperty.call(root, p)) {
        return root[p as never]
      } else {
        return fetch[p as never]
      }
    },
    set(_target, p, newValue, _receiver) {
      if (Object.prototype.hasOwnProperty.call(root, p)) {
        root[p as keyof typeof root] = newValue
      } else {
        fetch[p as keyof typeof fetch] = newValue
      }

      return true
    },
    apply(target, _thisArg, argArray) {
      return target(...argArray)
    },
  })

  return proxy
}
