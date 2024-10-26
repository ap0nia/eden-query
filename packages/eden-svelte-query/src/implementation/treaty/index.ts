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
import type { EdenTreatyQueryUtils } from './query-utils'
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
 * Utilities available at the treaty-query root.
 */
export interface EdenTreatySvelteQueryBase<TElysia extends AnyElysia, TSSRContext> {
  /**
   * Get utilities provided via the context API.
   */
  getUtils(): EdenTreatyQueryUtils<TElysia, TSSRContext>

  /**
   * Get utilities provided via the context API.
   *
   * Alias for {@link getUtils}
   */
  getContext(): EdenTreatyQueryUtils<TElysia, TSSRContext>

  /**
   * Returns everything needed to set context.
   *
   * e.g. the root utility functions, and configuration settings.
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
  ): EdenTreatyQueryUtils<TElysia, TSSRContext>

  /**
   * Create utilities and provide them via context.
   */
  setContext(
    props: EdenContextProps<TElysia, TSSRContext>,
    config?: EdenQueryConfig<TElysia>,
  ): EdenContextState<TElysia, TSSRContext>

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

  /**
   * `createQueries` tanstack-query hook.
   */
  createQueries: EdenTreatyCreateQueries<TElysia>
}

/**
 * A strongly-typed proxy with tanstack-query hooks for interacting with the {@link AnyElysia} backend.
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
   * The {@link RouteSchema} from the {@link AnyElysia} instance.
   */
  TSchema extends Record<string, any>,

  // The current path segments up to this point.
  TPath extends any[] = [],

  // Keys that are considered path parameters instead of regular path segments.
  TRouteParams = ExtractEdenTreatyRouteParams<TSchema>,
> =
  // Iterate over all regular path segments (excluding path paramters), and convert them
  // to leaves or recursively process them.
  {
    [K in Exclude<keyof TSchema, keyof TRouteParams>]:
    TSchema[K] extends RouteSchema

    // If the current value is a route, then the current key is the HTTP method,
    // e.g. "get", "post", etc. and the path segments up to this point is the actual route
    // (excluding path parameters).
    ? EdenTreatySvelteQueryRouteLeaf<TSchema[K], K, TPath>

    // If the current value is not a route, then add the key to the path segments found,
    // then recursively process it.
    : EdenTreatySvelteQueryHooksProxy<TSchema[K], [...TPath, K]>
  }
  &
  // If there are no route parameters, then intersect with an empty object as a NOOP.
  // Otherwise, this part of the proxy can also be called like a function, which will
  // return the rest of the proxy (excluding the current path parameter).
  ({} extends TRouteParams
    ? {}
    : (
      params: StoreOrVal<ExtractEdenTreatyRouteParamsInput<TRouteParams>>,
    ) => EdenTreatySvelteQueryHooksProxy<
      TSchema[Extract<keyof TRouteParams, keyof TSchema>],
      TPath
    >)

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
    ? EdenTreatyQueryMutationLeaf<TRoute, TPath>
    : TMethod extends HttpSubscriptionMethod
      ? EdenTreatyQuerySubscriptionLeaf<TRoute, TPath>
      : EdenTreatyQueryUnknownLeaf<TRoute, TPath>

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
export type EdenTreatyQueryMutationLeaf<TRoute extends RouteSchema, TPath extends any[] = []> = {
  createMutation: EdenCreateMutation<TRoute, TPath>
}

/**
 * @TODO: Available hooks assuming that the route supports `createSubscription`.
 *
 * e.g. Routes that support "CONNECT" or "SUBSCRIBE" requests.
 */
export type EdenTreatyQuerySubscriptionLeaf<
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
export type EdenTreatyQueryUnknownLeaf<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
> = EdenTreatySvelteQueryLeaf<TRoute, TPath> &
  EdenTreatySvelteQueryInfiniteQueryLeaf<TRoute, TPath> &
  EdenTreatyQueryMutationLeaf<TRoute, TPath> &
  EdenTreatyQuerySubscriptionLeaf<TRoute, TPath>

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
 */
export function createEdenTreatySvelteQueryProxy<T extends AnyElysia = AnyElysia>(
  /**
   * Root hooks that were created.
   */
  rootHooks: EdenTreatyQueryRootHooks<T>,

  /**
   * The original configuration for eden-treaty.
   */
  config?: EdenQueryConfig<T>,

  /**
   * Path parameter strings including the current path parameter as a placeholder.
   *
   * @example [ 'products', ':id', ':cursor' ]
   */
  paths: (string | symbol)[] = [],

  /**
   * An array of objects representing path parameter replacements.
   * @example [ { id: 123 }, writable({ cursor: '456' }) ]
   */
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

      // Determine if the property can be found on the root hooks.
      // e.g. "createQuery," "createMutation," etc.
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

      // The order of arguments passed to "createMutation" differs from everything else for some reason.
      // Directly mutate the arguments so they are always uniform before being passed to a root hook.
      const modifiedArgs = mutateArgs(hook, args, pathParams)

      // Dynamically invoke a root hook.
      return (rootHooks as any)[hook](pathsCopy, ...modifiedArgs)
    },
  })

  return edenTreatyQueryProxy
}

export const routeDefinitionSymbol = Symbol('eden-treaty-query-defs')

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
