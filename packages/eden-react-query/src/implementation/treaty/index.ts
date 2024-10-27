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
import type { AnyElysia, RouteSchema } from 'elysia'
import type { Prettify } from 'elysia/types'

import type { EdenQueryConfig } from '../../config'
import type { EdenContextProps, EdenContextState, EdenProvider } from '../../context'
import type { EdenUseInfiniteQuery } from '../../integration/hooks/use-infinite-query'
import type { EdenUseMutation } from '../../integration/hooks/use-mutation'
import type { EdenUseQuery } from '../../integration/hooks/use-query'
import type { EdenUseSuspenseInfiniteQuery } from '../../integration/hooks/use-suspense-infinite-query'
import type { EdenUseSuspenseQuery } from '../../integration/hooks/use-suspense-query'
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
import type { EdenTreatyQueryUtils } from './query-utils'
import { createEdenTreatyQueryRootHooks, type EdenTreatyQueryRootHooks } from './root-hooks'
import type { EdenTreatyUseQueries } from './use-queries'
import type { EdenTreatyUseSuspenseQueries } from './use-suspense-queries'

/**
 * The treaty-query API provides utility methods that are available at the root, as well as
 * a strongly-typed proxy representing the {@link AnyElysia} API.
 */
export type EdenTreatyReactQuery<TElysia extends AnyElysia, TSSRContext> = EdenTreatyReactQueryBase<
  TElysia,
  TSSRContext
> &
  EdenTreatyReactQueryHooks<TElysia>

/**
 * Utilities available at the eden-treaty + react-query root.
 */
export interface EdenTreatyReactQueryBase<TElysia extends AnyElysia, TSSRContext> {
  /**
   * Get utilities provided via the context API.
   *
   * @see https://trpc.io/docs/v11/client/react/useUtils
   */
  useUtils(): EdenTreatyQueryUtils<TElysia, TSSRContext>

  /**
   * Returns everything that will be provided from context.
   *
   * e.g. the root utility functions, and root configuration settings.
   */
  createContext(
    props: EdenContextProps<TElysia, TSSRContext>,
  ): EdenContextState<TElysia, TSSRContext>

  /**
   * Creates a proxy that can invoke tanstack-query helper functions.
   */
  createUtils(
    props: EdenContextProps<TElysia, TSSRContext>,
  ): EdenTreatyQueryUtils<TElysia, TSSRContext>

  /**
   * Get utilities provided via the context API.
   *
   * @deprecated renamed to {@link useUtils} and will be removed in a future tRPC version
   *
   * @link https://trpc.io/docs/v11/client/react/useUtils
   */
  useContext(): EdenTreatyQueryUtils<TElysia, TSSRContext>

  /**
   * React.Provider to set the context.
   */
  Provider: EdenProvider<TElysia, TSSRContext>

  /**
   * Wraps the `useQueries` react-query hook in a type-safe proxy.
   */
  useQueries: EdenTreatyUseQueries<TElysia>

  /**
   * Wraps the `useSuspenseQueries` react-query hook in a type-safe proxy.
   */
  useSuspenseQueries: EdenTreatyUseSuspenseQueries<TElysia>

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
export type EdenTreatyReactQueryHooks<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatyReactQueryHooksProxy<TSchema>
  : 'Please install Elysia before using Eden'

/**
 * TypeScript implementation for the proxy.
 *
 * Recursively iterate over all keys in the {@link RouteSchema}, processing path parameters
 * and regular path segments separately.
 */
// prettier-ignore
export type EdenTreatyReactQueryHooksProxy<
  /**
   * The {@link RouteSchema} or {@link Routes} from the {@link AnyElysia} instance.
   */
  TSchema extends Record<string, any>,
  // The current path segments up to this point.
  TPath extends any[] = [],
  // Keys that are considered path parameters instead of regular path segments.
  TRouteParams = ExtractEdenTreatyRouteParams<TSchema>,
> = EdenTreatyReactQueryPathHooks<TSchema, TPath, TRouteParams> &
  EdenTreatyReactQueryHooksPathParameterHook<TSchema, TPath, TRouteParams>

export type EdenTreatyReactQueryPathHooks<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
  TRouteParams = ExtractEdenTreatyRouteParams<TSchema>,
> = {
  [K in Exclude<keyof TSchema, keyof TRouteParams>]: TSchema[K] extends RouteSchema
    ? EdenTreatyReactQueryRouteLeaf<TSchema[K], K, TPath>
    : EdenTreatyReactQueryHooksProxy<TSchema[K], [...TPath, K]>
}

type EdenTreatyReactQueryHooksPathParameterHook<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
  TRouteParams = {},
> = {} extends TRouteParams
  ? {}
  : (
      params: ExtractEdenTreatyRouteParamsInput<TRouteParams>,
    ) => EdenTreatyReactQueryHooksProxy<TSchema[Extract<keyof TRouteParams, keyof TSchema>], TPath>
/**
 * Maps a {@link RouteSchema} to an object with hooks.
 *
 * Defines available hooks for a specific route.
 *
 * @example { useQuery: ..., useInfiniteQuery: ... }
 */
export type EdenTreatyReactQueryRouteLeaf<
  TRoute extends RouteSchema,
  TMethod,
  TPath extends any[] = [],
> = TMethod extends HttpQueryMethod
  ? EdenTreatyReactQueryLeaf<TRoute, TPath>
  : TMethod extends HttpMutationMethod
    ? EdenTreatyReactQueryMutationLeaf<TRoute, TPath>
    : TMethod extends HttpSubscriptionMethod
      ? EdenTreatyReactQuerySubscriptionLeaf<TRoute, TPath>
      : EdenTreatyReactQueryUnknownLeaf<TRoute, TPath>

/**
 * Available hooks assuming that the route supports `useQuery`.
 *
 * e.g. Routes with a "GET" endpoint.
 */
export type EdenTreatyReactQueryLeaf<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput extends InferRouteOptions<TRoute> = InferRouteOptions<TRoute>,
> = {
  useQuery: EdenUseQuery<TRoute, TPath>
  useSuspenseQuery: EdenUseSuspenseQuery<TRoute, TPath>
} & (InfiniteCursorKey extends keyof (TInput['params'] & TInput['query'])
  ? EdenTreatyReactQueryInfiniteQueryLeaf<TRoute, TPath>
  : {})

/**
 * Available hooks assuming that the route supports `useInfiniteQuery`.
 *
 * e.g. Routes with a "GET" endpoint that expects "cursor" as a possible query parameter.
 */
export type EdenTreatyReactQueryInfiniteQueryLeaf<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
> = {
  useInfiniteQuery: EdenUseInfiniteQuery<TRoute, TPath>
  useSuspenseInfiniteQuery: EdenUseSuspenseInfiniteQuery<TRoute, TPath>
}

/**
 * Available hooks assuming that the route supports `useMutation`.
 *
 * e.g. Basically a route with any HTTP methods other than "GET."
 */
export type EdenTreatyReactQueryMutationLeaf<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
> = {
  useMutation: EdenUseMutation<TRoute, TPath>
}

/**
 * @TODO: Available hooks assuming that the route supports `useSubscription`.
 *
 * e.g. Routes that support "CONNECT" or "SUBSCRIBE" requests.
 */
export type EdenTreatyReactQuerySubscriptionLeaf<
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
export type EdenTreatyReactQueryUnknownLeaf<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
> = EdenTreatyReactQueryLeaf<TRoute, TPath> &
  EdenTreatyReactQueryInfiniteQueryLeaf<TRoute, TPath> &
  EdenTreatyReactQueryMutationLeaf<TRoute, TPath> &
  EdenTreatyReactQuerySubscriptionLeaf<TRoute, TPath>

export function createEdenTreatyReactQuery<TElysia extends AnyElysia, TSSRContext = unknown>(
  config?: EdenQueryConfig<TElysia>,
): EdenTreatyReactQuery<TElysia, TSSRContext> {
  /**
   * Root hooks are invoked by leaf nodes in the proxy.
   */
  const rootHooks = createEdenTreatyQueryRootHooks(config)

  /**
   * The actual proxy.
   */
  const edenTreatyReactQueryProxy = createEdenTreatyReactQueryProxy(rootHooks, config)

  /**
   * Wrapper around the proxy that will attempt to return properties found
   * on the root hooks before accessing the proxy.
   */
  const edenTreatyReactQuery = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      if (Object.prototype.hasOwnProperty.call(rootHooks, path)) {
        return rootHooks[path as never]
      }
      return edenTreatyReactQueryProxy[path as never]
    },
  })

  return edenTreatyReactQuery as any
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
export function createEdenTreatyReactQueryProxy<T extends AnyElysia = AnyElysia>(
  rootHooks: EdenTreatyQueryRootHooks<T>,
  config?: EdenQueryConfig<T>,
  paths: (string | symbol)[] = [],
  pathParams: Record<string, any>[] = [],
) {
  const edenTreatyQueryProxy = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createEdenTreatyReactQueryProxy(rootHooks, config, nextPaths, pathParams)
    },
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
       * @example "useQuery," "useMutation," etc.
       */
      const isRootProperty = Object.prototype.hasOwnProperty.call(rootHooks, hook)

      if (pathParam?.key != null && !isRootProperty) {
        const allPathParams = [...pathParams, pathParam.param]
        const pathsWithParams = [...paths, `:${pathParam.key}`]
        return createEdenTreatyReactQueryProxy(rootHooks, config, pathsWithParams, allPathParams)
      }

      // There is no option to pass in input from the public exposed hook,
      // but the internal root `useMutation` hook expects input as the first argument.
      // Add an empty element at the front representing "input".
      if (hook === 'useMutation') {
        args.unshift(undefined)
      }

      const modifiedArgs = mutateArgs(hook, args, pathParams)

      /**
       * ```ts
       * // The final hook that was invoked.
       * const hook = "useQuery"
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
       * rootHooks.useQuery(
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

export function getQueryKey<TSchema extends Record<string, any>>(
  route: EdenTreatyReactQueryHooksProxy<TSchema>,
  input?: TSchema extends RouteSchema ? InferRouteOptions<TSchema> : any,
  type?: EdenQueryType,
): EdenQueryKey {
  const paths = (route as any)[routeDefinitionSymbol]()
  return internalGetQueryKey(paths, input, type ?? 'any')
}

export function getMutationKey<TSchema extends RouteSchema>(
  route: EdenTreatyReactQueryHooksProxy<TSchema>,
  options?: EdenQueryKeyOptions,
): EdenMutationKey {
  const paths = (route as any)[routeDefinitionSymbol]()
  return internalGetMutationKey(paths, options)
}

export const routeDefinitionSymbol = Symbol('eden-treaty-react-query-defs')

export * from './infer'
export * from './query-utils'
export * from './root-hooks'
export * from './use-queries'
export * from './use-suspense-queries'
