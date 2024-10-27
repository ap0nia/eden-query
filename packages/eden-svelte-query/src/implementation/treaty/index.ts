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
import type { EdenTreatyCreateQueries } from './create-queries'
import type { EdenTreatySvelteQueryUtils } from './query-utils'
import { createEdenTreatyQueryRootHooks, type EdenTreatyQueryRootHooks } from './root-hooks'

/**
 * The treaty-query API provides utility methods that are available at the root, as well as
 * a strongly-typed proxy representing the {@link AnyElysia} API.
 */
export type EdenTreatySvelteQuery<
  TElysia extends AnyElysia,
  TSSRContext,
> = EdenTreatySvelteQueryBase<TElysia, TSSRContext> & EdenTreatyQueryHooks<TElysia>

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
  createQueries: EdenTreatyCreateQueries<TElysia>

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
 * A strongly-typed proxy with svelte-query hooks for interacting with the {@link AnyElysia} backend.
 */
export type EdenTreatyQueryHooks<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatySvelteQueryHooksProxy<TSchema>
  : 'Please install Elysia before using Eden'

/**
 * TypeScript implementation for the proxy.
 *
 * Recursively iterate over all keys in the {@link RouteSchema}, processing path parameters
 * and regular path segments separately.
 */
// prettier-ignore
export type EdenTreatySvelteQueryHooksProxy<
  /**
   * The {@link RouteSchema} or {@link Routes} from the {@link AnyElysia} instance.
   */
  TSchema extends Record<string, any>,

  // The current path segments up to this point.
  TPath extends any[] = [],

  // Keys that are considered path parameters instead of regular path segments.
  TRouteParams = ExtractEdenTreatyRouteParams<TSchema>,
> =
EdenTreatySvelteQueryPathHooks<TSchema, TPath, TRouteParams> &
  EdenTreatySvelteQueryHooksPathParameterHook<TSchema, TPath, TRouteParams>

/**
 * Iterate over all regular path segments (excluding path parameters), and convert them
 * to leaves or recursively process them.
 *
 * If the current value is a route, then the current key is the HTTP method,
 * e.g. "get", "post", etc. and the path segments up to this point is the actual route
 * (excluding path parameters).
 *
 * If the current value is not a route, then add the key to the path segments found,
 * then recursively process it.
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
 * If there are no route parameters, then return empty object.
 * Otherwise, this part of the proxy can also be called like a function, which will
 * return the rest of the proxy (excluding the current path parameter).
 */
type EdenTreatySvelteQueryHooksPathParameterHook<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
  TRouteParams = {},
> = {} extends TRouteParams
  ? {}
  : (
      params: ExtractEdenTreatyRouteParamsInput<TRouteParams>,
    ) => EdenTreatySvelteQueryHooksProxy<TSchema[Extract<keyof TRouteParams, keyof TSchema>], TPath>

/**
 * Leaf node for the proxy that maps a {@link RouteSchema} to an object with hooks.
 *
 * @example { createQuery: ..., createInfiniteQuery: ... }
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
 * Available hooks assuming that the route supports `createQuery`.
 *
 * e.g. Routes with a "GET" endpoint.
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
 * Available hooks assuming that the route supports `createInfiniteQuery`.
 *
 * e.g. Routes with a "GET" endpoint that expects "cursor" as a possible query parameter.
 */
export type EdenTreatySvelteQueryInfiniteQueryLeaf<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
> = {
  createInfiniteQuery: EdenCreateInfiniteQuery<TRoute, TPath>
}

/**
 * Available hooks assuming that the route supports `createMutation`.
 *
 * e.g. Basically a route with any HTTP methods other than "GET."
 */
export type EdenTreatySvelteQueryMutationLeaf<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
> = {
  createMutation: EdenCreateMutation<TRoute, TPath>
}

/**
 * @TODO: Available hooks assuming that the route supports `createSubscription`.
 *
 * e.g. Routes that support "CONNECT" or "SUBSCRIBE" requests.
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
 * Available hooks for unrecognized HTTP methods.
 *
 * Will just show all possible hooks...
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
 */
export function createEdenTreatySvelteQuery<TElysia extends AnyElysia, TSSRContext = unknown>(
  /**
   * Default configuration for the root hooks.
   */
  config?: EdenQueryConfig<TElysia>,
): EdenTreatySvelteQuery<TElysia, TSSRContext> {
  /**
   * Root hooks are invoked by leaf nodes in the proxy.
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
    /**
     * When a property is accessed on proxy, return a nested proxy.
     */
    get: (_target, path: string, _receiver): any => {
      // Copy the paths so that it can not be accidentally mutated.
      // Add the new path if it's not an "index" route.
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]

      //  Return a nested proxy that has been "pre-filled" with the new paths.
      return createEdenTreatySvelteQueryProxy(rootHooks, config, nextPaths, pathParams)
    },

    /**
     * When the proxy is called like a function,
     * - Return another proxy if it's called to pass path parameters.
     * - Invoke the actual tanstack-query hook and return the result.
     */
    apply: (_target, _thisArg, args) => {
      /**
       * @example ['products']
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
       * while they key is the string representing the placeholder.
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
         * @example [ { id: 123 }, { cursor: '456' } ]
         */
        const allPathParams = [...pathParams, pathParam.param]

        /**
         * Path parameter strings including the current path parameter as a placeholder.
         *
         * @example [ 'products', ':id', ':cursor' ]
         */
        const pathsWithParams = [...paths, `:${pathParam.key}`]

        return createEdenTreatySvelteQueryProxy(rootHooks, config, pathsWithParams, allPathParams)
      }

      // There is no option to pass in input from the public exposed hook,
      // but the internal root `useMutation` hook expects input as the first argument.
      // Add an empty element at the front representing "input".
      if (hook === 'createMutation') {
        args.unshift(undefined)
      }

      // The order of arguments passed to "createMutation" differs from everything else for some reason.
      // Directly mutate the arguments so they are always uniform before being passed to a root hook.
      const modifiedArgs = mutateArgs(hook, args, pathParams)

      /**
       * ```ts
       * // The final hook that was invoked.
       * const hook = "createQuery"
       *
       * // The array of path segments up to this point.
       * // Note how ":id" is included, this will be replaced by the `resolveRequest` function from eden.
       * const pathsCopy = ["nendoroid", ":id", "name"]
       *
       * // Accummulated path parameters up to this point.
       * const pathParams = [ { id: 1895 } ]
       *
       * // The user provided a search query and query options.
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
       * rootHooks.createQuery(
       *   ["nendoroid", ":id", "name"],
       *   { query: { location: "jp" }, params: { id: 1895 } },
       *   { refetchOnMount: false }
       * )
       * ```
       */
      const result = (rootHooks as any)[hook](pathsCopy, ...modifiedArgs)

      return result
    },
  })

  return edenTreatyQueryProxy
}

export const routeDefinitionSymbol = Symbol('eden-treaty-svelte-query-defs')

export function getQueryKey<TSchema extends Record<string, any>>(
  route: EdenTreatySvelteQueryHooksProxy<TSchema>,
  input?: TSchema extends RouteSchema ? InferRouteOptions<TSchema> : any,
  type?: EdenQueryType,
): EdenQueryKey {
  const paths = (route as any)[routeDefinitionSymbol]()
  return internalGetQueryKey(paths, input, type ?? 'any')
}

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
