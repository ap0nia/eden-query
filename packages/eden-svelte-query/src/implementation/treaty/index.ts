import type {
  EdenClient,
  EdenCreateClient,
  EdenRequestOptions,
  ExtractEdenTreatyRouteParams,
  ExtractEdenTreatyRouteParamsInput,
  HttpBatchLinkOptions,
  HTTPLinkOptions,
  HttpMutationMethod,
  HttpQueryMethod,
  HttpSubscriptionMethod,
  InferRouteOptions,
  TypeError,
} from '@ap0nia/eden'
import type { StoreOrVal } from '@tanstack/svelte-query'
import type { AnyElysia, RouteSchema } from 'elysia'
import type { Prettify } from 'elysia/types'

import type { EdenQueryConfig } from '../../config'
import type { EdenContextProps, EdenContextState } from '../../context'
import type { EdenCreateInfiniteQuery } from '../../integration/hooks/create-infinite-query'
import type { EdenCreateMutation } from '../../integration/hooks/create-mutation'
import type { EdenCreateQuery } from '../../integration/hooks/create-query'
import type { InfiniteCursorKey } from '../../integration/internal/infinite-query'
import type {
  EdenMutationKey,
  EdenQueryKey,
  EdenQueryKeyOptions,
  EdenQueryType,
} from '../../integration/internal/query-key'
import {
  getMutationKey as internalGetMutationKey,
  getQueryKey as internalGetQueryKey,
} from '../../integration/internal/query-key'
import { getPathParam, mutateArgs } from '../../utils/path-param'
import type { EdenTreatySvelteQueryCreateQueries } from './create-queries'
import type { EdenTreatySvelteQueryUtils } from './query-utils'
import { createEdenTreatyQueryRootHooks, type EdenTreatyQueryRootHooks } from './root-hooks'

/**
 * The treaty-query API provides utility methods that are available at the root, as well as
 * a strongly-typed proxy representing the {@link AnyElysia} API.
 */
export type EdenTreatySvelteQuery<
  TElysia extends AnyElysia,
  TSSRContext,
> = EdenTreatySvelteQueryBase<TElysia, TSSRContext> & EdenTreatySvelteQueryHooks<TElysia>

/**
 * Utilities available at the eden-treaty + svelte-query root.
 */
export interface EdenTreatySvelteQueryBase<TElysia extends AnyElysia, TSSRContext> {
  /**
   * Get utilities provided via the context API.
   *
   * @see https://trpc.io/docs/v11/client/react/useUtils
   */
  getUtils(): EdenTreatySvelteQueryUtils<TElysia, TSSRContext>

  /**
   * Get utilities provided via the context API.
   *
   * @deprecated renamed to {@link getUtils} and will be removed in a future tRPC version
   *
   * @see https://trpc.io/docs/v11/client/react/useUtils
   */
  getContext(): EdenTreatySvelteQueryUtils<TElysia, TSSRContext>

  /**
   * Returns everything that will be provided from context.
   *
   * e.g. the root utility functions, and root configuration settings.
   */
  createContext(
    props: EdenContextProps<TElysia, TSSRContext>,
    config?: EdenQueryConfig<TElysia>,
  ): EdenContextState<TElysia, TSSRContext>

  /**
   * Creates a proxy that can invoke tanstack-query helper functions.
   */
  createUtils(
    props: EdenContextProps<TElysia, TSSRContext>,
    config?: EdenQueryConfig<TElysia>,
  ): EdenTreatySvelteQueryUtils<TElysia, TSSRContext>

  /**
   * Create utilities and provide them via context.
   */
  setContext(
    props: EdenContextProps<TElysia, TSSRContext>,
    config?: EdenQueryConfig<TElysia>,
  ): EdenContextState<TElysia, TSSRContext>

  /**
   * Wraps the `create-queries` svelte-query hook in a type-safe proxy.
   */
  createQueries: EdenTreatySvelteQueryCreateQueries<TElysia>

  /**
   * Create a raw, untyped-client.
   */
  createClient: EdenCreateClient<TElysia>

  /**
   * Convenience method for creating and configuring a client with a single HTTPLink.
   */
  createHttpClient: (options?: HTTPLinkOptions<TElysia>) => EdenClient<TElysia>

  /**
   * Convenience method for creating and configuring a client with a single HttpBatchLink.
   */
  createHttpBatchClient: (options?: HttpBatchLinkOptions<TElysia>) => EdenClient<TElysia>
}

/**
 * RPC proxy derived from {@link AnyElysia._routes} that connects svelte-query with an Elysia.js API.
 */
export type EdenTreatySvelteQueryHooks<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatySvelteQueryHooksProxy<TSchema>
  : TypeError<'Please install Elysia before using Eden'>

/**
 * Recursively iterate over all keys in {@link AnyElyisa._routes}, processing path parameters
 * and regular path segments separately.
 *
 * Regular path parameters will be mapped to a nested object, and then intersected
 * with anything generated by dynamic path parameters.
 *
 * @template TSchema The current level of {@link AnyElysia._routes} being processed.
 * @template TPath The current path segments up to this point (excluding dynamic path parameters).
 * @template TRouteParams Keys that are considered path parameters instead of regular path segments.
 */
export type EdenTreatySvelteQueryHooksProxy<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
  TRouteParams = ExtractEdenTreatyRouteParams<TSchema>,
> = EdenTreatySvelteQueryPathHooks<TSchema, TPath, TRouteParams> &
  EdenTreatySvelteQueryHooksPathParameterHook<TSchema, TPath, TRouteParams>

/**
 * Recursively handle regular path segments (i.e. NOT path parameters).
 *
 * If the value is a {@link RouteSchema}, then it's a "leaf" that does not need to be
 * recursively processed. The result should be the key, an HTTP method, mapped to svelte-query hooks.
 *
 * @template TSchema The current level of {@link AnyElysia._routes} being processed.
 * @template TPath The current path segments up to this point (excluding dynamic path parameters).
 * @template TRouteParams Keys that are considered path parameters instead of regular path segments.
 */
export type EdenTreatySvelteQueryPathHooks<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
  TRouteParams = ExtractEdenTreatyRouteParams<TSchema>,
> = {
  [K in Exclude<keyof TSchema, keyof TRouteParams>]: TSchema[K] extends RouteSchema
    ? EdenTreatySvelteQueryRouteLeaf<TSchema[K], K, TPath>
    : EdenTreatySvelteQueryHooksProxy<TSchema[K], [...TPath, K]>
}

/**
 * This intersects the object created by {@link EdenTreatyPathHooks}
 * (for regular path parameters) to handle dynamic path parameters.
 *
 * If there are no dynamic path parameters, then return an empty object.
 * Intersecting with empty object does nothing.
 *
 * Otherwise, return a function that returns the next level of the proxy, omitting
 * the current dynamic path parameter.
 *
 * @template TSchema The current level of {@link AnyElysia._routes} being processed.
 * @template TPath The current path segments up to this point (excluding dynamic path parameters).
 * @template TRouteParams Keys that are considered path parameters instead of regular path segments.
 */
export type EdenTreatySvelteQueryHooksPathParameterHook<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
  TRouteParams = {},
> = {} extends TRouteParams
  ? {}
  : (
      params: StoreOrVal<ExtractEdenTreatyRouteParamsInput<TRouteParams>>,
    ) => EdenTreatySvelteQueryHooksProxy<TSchema[Extract<keyof TRouteParams, keyof TSchema>], TPath>

/**
 * When a {@link RouteSchema} is found, map it to leaves and stop recursive processing.
 * Leaves are objects with svelte-query hooks related to the HTTP method.
 *
 * For example, the object would contain hooks for queries if {@link TMethod} was "get".
 *
 * @template TRoute The {@link RouteSchema} that was found.
 * @template TMethod The most recent key that was mapped to the {@link TRoute}. e.g. "get", "post", etc.
 * @template TPath The current path segments up to this point (excluding dynamic path parameters).
 */
export type EdenTreatySvelteQueryRouteLeaf<
  TRoute extends RouteSchema,
  TMethod,
  TPath extends any[] = [],
> = TMethod extends HttpQueryMethod
  ? EdenTreatySvelteQueryLeaf<TRoute, TPath>
  : TMethod extends HttpMutationMethod
    ? EdenTreatySvelteQueryMutationLeaf<TRoute, TPath>
    : TMethod extends HttpSubscriptionMethod
      ? EdenTreatySvelteQuerySubscriptionLeaf<TRoute, TPath>
      : EdenTreatySvelteQueryUnknownLeaf<TRoute, TPath>

/**
 * svelte-query hooks for "queries". e.g. routes with a "GET" endpoint.
 */
export type EdenTreatySvelteQueryLeaf<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput extends InferRouteOptions<TRoute> = InferRouteOptions<TRoute>,
> = {
  createQuery: EdenCreateQuery<TRoute, TPath>
} & (InfiniteCursorKey extends keyof (TInput['params'] & TInput['query'])
  ? EdenTreatySvelteQueryInfiniteQueryLeaf<TRoute, TPath>
  : {})

/**
 * svelte-query hooks for "infinite-queries".
 * e.g. routes with a "GET" endpoint that also expects "cursor" as a query parameter.
 */
export type EdenTreatySvelteQueryInfiniteQueryLeaf<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
> = {
  createInfiniteQuery: EdenCreateInfiniteQuery<TRoute, TPath>
}

/**
 * svelte-query hooks for "mutations". e.g. Basically routes with any HTTP methods other than "GET."
 */
export type EdenTreatySvelteQueryMutationLeaf<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
> = {
  createMutation: EdenCreateMutation<TRoute, TPath>
}

/**
 * @todo: svelte-query hooks for "subscriptions". e.g. Basically routes that support "CONNECT" or "SUBSCRIBE" requests.
 *
 * @see https://github.com/trpc/trpc/blob/52a57eaa9c12394778abf5f0e6b52ec6f46288ed/packages/react-query/src/shared/hooks/createHooksInternal.tsx#L347
 * @see https://tkdodo.eu/blog/using-web-sockets-with-react-query
 */
export type EdenTreatySvelteQuerySubscriptionLeaf<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
> = {
  options: Prettify<EdenRequestOptions & TInput>
  queryKey: EdenQueryKey<TPath>
}

/**
 * svelte-query hooks for any unknown HTTP methods will just expose all known hooks for now.
 *
 * @todo Decide what hooks to expose...
 */
export type EdenTreatySvelteQueryUnknownLeaf<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
> = EdenTreatySvelteQueryLeaf<TRoute, TPath> &
  EdenTreatySvelteQueryInfiniteQueryLeaf<TRoute, TPath> &
  EdenTreatySvelteQueryMutationLeaf<TRoute, TPath> &
  EdenTreatySvelteQuerySubscriptionLeaf<TRoute, TPath>

/**
 * Main entrypoint for this library.
 *
 * @param config Default configuration for the root hooks.
 */
export function createEdenTreatySvelteQuery<TElysia extends AnyElysia, TSSRContext = unknown>(
  config?: EdenQueryConfig<TElysia>,
): EdenTreatySvelteQuery<TElysia, TSSRContext> {
  /**
   * Root hooks are invoked by leaf nodes in the proxy.
   * Create the utility functions once at the beginning, and have all leaves use the same one.
   */
  const rootHooks = createEdenTreatyQueryRootHooks(config)

  /**
   * The actual proxy.
   */
  const edenTreatySvelteQueryProxy = createEdenTreatySvelteQueryProxy(rootHooks, config)

  /**
   * Wrapper around the proxy that will attempt to return properties found
   * on the root hooks before accessing the proxy.
   */
  const edenTreatySvelteQuery = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      if (Object.prototype.hasOwnProperty.call(rootHooks, path)) {
        return rootHooks[path as never]
      }
      return edenTreatySvelteQueryProxy[path as never]
    },
  })

  return edenTreatySvelteQuery as any
}

/**
 * Creates the recursive proxy.
 *
 * @param config Root hooks that were created.
 *
 * @param rootHooks The original configuration for eden-treaty.
 *
 * @param paths Path parameter strings including the current path parameter as a placeholder.
 *  @example [ 'products', ':id', ':cursor' ]
 *
 * @param pathParams An array of objects representing path parameter replacements.
 * @example [ { id: 123 }, writable({ cursor: '456' }) ]
 */
export function createEdenTreatySvelteQueryProxy<T extends AnyElysia = AnyElysia>(
  rootHooks: EdenTreatyQueryRootHooks<T>,
  config?: EdenQueryConfig<T>,
  paths: (string | symbol)[] = [],
  pathParams: StoreOrVal<Record<string, any>>[] = [],
) {
  const edenTreatyQueryProxy = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      // Copy the paths so that it will not be mutated in a nested proxy.
      // Only add the current path if is not "index".
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]

      //  Return a nested proxy that has the new paths.
      return createEdenTreatySvelteQueryProxy(rootHooks, config, nextPaths, pathParams)
    },
    apply: (_target, _thisArg, args) => {
      /**
       * @example ['nendoroid', 'createQuery']
       */
      const pathsCopy = [...paths]

      /**
       * @example 'createQuery'
       */
      const hook = pathsCopy.pop() ?? ''

      /**
       * Hook that returns path segment array.
       *
       * @internal
       */
      if (hook === routeDefinitionSymbol) {
        return pathsCopy
      }

      /**
       * Determine whether a path parameter can be found from the provided args.
       *
       * @example { param: { id: '123' }, key: 'id' }
       *
       * The `param` property is the actual argument that was passed,
       * while the key is the string representing the placeholder.
       */
      const pathParam = getPathParam(args)

      /**
       * Determine if the property can be found on the root hooks.
       * @example "createQuery," "createMutation," etc.
       */
      const isRootProperty = Object.prototype.hasOwnProperty.call(rootHooks, hook)

      if (pathParam?.key != null && !isRootProperty) {
        /**
         * An array of objects representing path parameter replacements.
         * @example [ writable({ id: 123 }) ]
         */
        const allPathParams = [...pathParams, pathParam.param]

        /**
         * Path parameter strings including the current path parameter as a placeholder.
         *
         * @example [ 'nendoroid', ':id' ]
         */
        const pathsWithParams = [...paths, `:${pathParam.key}`]

        return createEdenTreatySvelteQueryProxy(rootHooks, config, pathsWithParams, allPathParams)
      }

      // Mutate the args to ensure that it is ordered correctly for its corresponding function call.
      mutateArgs(hook, args, pathParams)

      /**
       * ```ts
       * // The final hook that was invoked.
       * const hook = "createQuery"
       *
       * // The array of path segments up to this point.
       * // Note how ":id" is included, this will be replaced by the `resolveRequest` function from eden.
       * const pathsCopy = ["nendoroid", ":id", "createQuery"]
       *
       * // Accummulated path parameters up to this point.
       * const pathParams = [ writable({ id: 1895 }) ]
       *
       * // If the provided a search query and query options, args may look like this.
       * const args = [ { location: "jp" }, { refetchOnUnmount: true } ]
       *
       * // The accummulated path parameters and search query are merged into one "input" object.
       * const modifiedArgs = [
       *   { query: { location: "jp" }, params: { id: 1895 } },
       *   { refetchOnMount: false }
       * ]
       *
       * // The full function call contains three arguments:
       * // array of path segments, input, and query options.
       *
       * @remarks
       * // For this example, the input has been converted to a Readable because one of the path
       * // parameters was a Readable Svelte store.
       *
       * rootHooks.createQuery(
       *   ["nendoroid", ":id", "name"],
       *   derived({ query: { location: "jp" }, params: { id: 1895 } }),
       *   { refetchOnMount: false }
       * )
       * ```
       */
      const result = (rootHooks as any)[hook](pathsCopy, ...args)

      return result
    },
  })

  return edenTreatyQueryProxy
}

export const routeDefinitionSymbol = Symbol('eden-treaty-svelte-query-route-definition')

/**
 * Get a query key by providing the proxy at any level.
 */
export function getQueryKey<TSchema extends Record<string, any>>(
  route: EdenTreatySvelteQueryHooksProxy<TSchema>,
  input?: TSchema extends RouteSchema ? InferRouteOptions<TSchema> : any,
  type?: EdenQueryType,
): EdenQueryKey {
  const paths = (route as any)[routeDefinitionSymbol]()
  return internalGetQueryKey(paths, input, type ?? 'any')
}

/**
 * Get a mutation key by providing the proxy at any level.
 */
export function getMutationKey<TSchema extends RouteSchema>(
  route: EdenTreatySvelteQueryHooksProxy<TSchema>,
  options?: EdenQueryKeyOptions,
): EdenMutationKey {
  const paths = (route as any)[routeDefinitionSymbol]()
  return internalGetMutationKey(paths, options)
}

export * from './create-queries'
export * from './infer'
export * from './query-utils'
export * from './root-hooks'
