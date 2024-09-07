import type {
  EdenClient,
  EdenCreateClient,
  EdenRequestOptions,
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

export type EdenTreatyReactQuery<TElysia extends AnyElysia, TSSRContext> = EdenTreatyReactQueryBase<
  TElysia,
  TSSRContext
> &
  EdenTreatyReactQueryHooks<TElysia>

export type EdenTreatyReactQueryBase<TElysia extends AnyElysia, TSSRContext> = {
  createContext(
    props: EdenContextProps<TElysia, TSSRContext>,
  ): EdenContextState<TElysia, TSSRContext>

  createUtils(
    props: EdenContextProps<TElysia, TSSRContext>,
  ): EdenTreatyQueryUtils<TElysia, TSSRContext>

  /**
   * @deprecated renamed to `useUtils` and will be removed in a future tRPC version
   *
   * @link https://trpc.io/docs/v11/client/react/useUtils
   */
  useContext(): EdenTreatyQueryUtils<TElysia, TSSRContext>

  /**
   * @link https://trpc.io/docs/v11/client/react/useUtils
   */
  useUtils(): EdenTreatyQueryUtils<TElysia, TSSRContext>

  Provider: EdenProvider<TElysia, TSSRContext>

  useQueries: EdenTreatyUseQueries<TElysia>

  useSuspenseQueries: EdenTreatyUseSuspenseQueries<TElysia>

  /**
   * Need to provide `links` in order for this client to work.
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

export type EdenTreatyReactQueryHooks<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatyReactQueryHooksImplementation<TSchema>
  : 'Please install Elysia before using Eden'

/**
 * Implementation.
 */
export type EdenTreatyReactQueryHooksImplementation<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
  TRouteParams = ExtractEdenTreatyRouteParams<TSchema>,
> = {
  [K in Exclude<keyof TSchema, keyof TRouteParams>]: TSchema[K] extends RouteSchema
    ? EdenTreatyReactQueryRouteHooks<TSchema[K], K, TPath>
    : EdenTreatyReactQueryHooksImplementation<TSchema[K], [...TPath, K]>
} & ({} extends TRouteParams
  ? {}
  : (
      params: ExtractEdenTreatyRouteParamsInput<TRouteParams>,
    ) => EdenTreatyReactQueryHooksImplementation<
      TSchema[Extract<keyof TRouteParams, keyof TSchema>],
      TPath
    >)

export type ExtractEdenTreatyRouteParams<T> = {
  [K in keyof T as K extends `:${string}` ? K : never]: T[K]
}

export type ExtractEdenTreatyRouteParamsInput<T> = {
  [K in keyof T as K extends `:${infer TParam}` ? TParam : never]: string | number
}

export type ExtractRouteParam<T> = T extends `:${infer TParam}` ? TParam : T

/**
 * Maps a {@link RouteSchema} to an object with hooks.
 *
 * Defines available hooks for a specific route.
 *
 * @example { useQuery: ..., useInfiniteQuery: ... }
 */
export type EdenTreatyReactQueryRouteHooks<
  TRoute extends RouteSchema,
  TMethod,
  TPath extends any[] = [],
> = TMethod extends HttpQueryMethod
  ? EdenTreatyQueryMapping<TRoute, TPath>
  : TMethod extends HttpMutationMethod
    ? EdenTreatyMutationMapping<TRoute, TPath>
    : TMethod extends HttpSubscriptionMethod
      ? EdenTreatySubscriptionMapping<TRoute, TPath>
      : never

/**
 * Available hooks assuming that the route supports useQuery.
 */
export type EdenTreatyQueryMapping<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput extends InferRouteOptions<TRoute> = InferRouteOptions<TRoute>,
> = {
  useQuery: EdenUseQuery<TRoute, TPath>
  useSuspenseQuery: EdenUseSuspenseQuery<TRoute, TPath>
} & (InfiniteCursorKey extends keyof (TInput['params'] & TInput['query'])
  ? EdenTreatyInfiniteQueryMapping<TRoute, TPath>
  : {})

/**
 * Available hooks assuming that the route supports useInfiniteQuery.
 */
export type EdenTreatyInfiniteQueryMapping<TRoute extends RouteSchema, TPath extends any[] = []> = {
  useInfiniteQuery: EdenUseInfiniteQuery<TRoute, TPath>
  useSuspenseInfiniteQuery: EdenUseSuspenseInfiniteQuery<TRoute, TPath>
}

/**
 * Available hooks assuming that the route supports useMutation.
 */
export type EdenTreatyMutationMapping<TRoute extends RouteSchema, TPath extends any[] = []> = {
  useMutation: EdenUseMutation<TRoute, TPath>
}

/**
 * @TODO: Available hooks assuming that the route supports useMutation.
 */
export type EdenTreatySubscriptionMapping<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
> = {
  options: Prettify<EdenRequestOptions & TInput>
  queryKey: EdenQueryKey<TPath>
}

export function createEdenTreatyReactQuery<TElysia extends AnyElysia, TSSRContext = unknown>(
  config?: EdenQueryConfig<TElysia>,
): EdenTreatyReactQuery<TElysia, TSSRContext> {
  const rootHooks = createEdenTreatyQueryRootHooks(config)

  const edenTreatyReactQueryProxy = createEdenTreatyReactQueryProxy(rootHooks, config)

  const edenTreatyQuery = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      if (Object.prototype.hasOwnProperty.call(rootHooks, path)) {
        return rootHooks[path as never]
      }
      return edenTreatyReactQueryProxy[path as never]
    },
  })

  return edenTreatyQuery as any
}

export function createEdenTreatyReactQueryProxy<T extends AnyElysia = AnyElysia>(
  rootHooks: EdenTreatyQueryRootHooks<T>,
  config?: EdenQueryConfig<T>,
  paths: string[] = [],
  pathParams: Record<string, any>[] = [],
) {
  const edenTreatyQueryProxy = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createEdenTreatyReactQueryProxy(rootHooks, config, nextPaths)
    },
    apply: (_target, _thisArg, args) => {
      const pathsCopy = [...paths]

      const hook = pathsCopy.pop() ?? ''

      /**
       * Hidden internal hook that returns the path array up to this point.
       */
      if (hook === '_defs') {
        return pathsCopy
      }

      const pathParam = getPathParam(args)

      if (pathParam?.key != null) {
        const allPathParams = [...pathParams, pathParam.param]
        const pathsWithParams = [...paths, `:${pathParam.key}`]
        return createEdenTreatyReactQueryProxy(rootHooks, config, pathsWithParams, allPathParams)
      }

      const modifiedArgs = mutateArgs(hook, args, pathParams)

      return (rootHooks as any)[hook](pathsCopy, ...modifiedArgs)
    },
  })

  return edenTreatyQueryProxy
}

export function getQueryKey<TSchema extends Record<string, any>>(
  route: EdenTreatyReactQueryHooksImplementation<TSchema>,
  input?: TSchema extends RouteSchema ? InferRouteOptions<TSchema> : any,
  type?: EdenQueryType,
): EdenQueryKey {
  const paths = (route as any).defs()
  return internalGetQueryKey(paths, input, type ?? 'any')
}

export function getMutationKey<TSchema extends RouteSchema>(
  route: EdenTreatyReactQueryHooksImplementation<TSchema>,
  options?: EdenQueryKeyOptions,
): EdenMutationKey {
  const paths = (route as any).defs()
  return internalGetMutationKey(paths, options)
}

export * from './infer'
export * from './root-hooks'
export * from './use-queries'
export * from './use-suspense-queries'
