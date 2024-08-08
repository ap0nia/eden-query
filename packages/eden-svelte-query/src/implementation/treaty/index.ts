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
import type { EdenContextProps, EdenContextState } from '../../context'
import type { EdenCreateInfiniteQuery } from '../../integration/hooks/create-infinite-query'
import type { EdenCreateMutation } from '../../integration/hooks/create-mutation'
import type { EdenCreateQuery } from '../../integration/hooks/create-query'
import type { InfiniteCursorKey } from '../../integration/internal/infinite-query'
import type { EdenQueryKey } from '../../integration/internal/query-key'
import type { EdenTreatyCreateQueries } from './create-queries'
import type { EdenTreatyQueryUtils } from './query-utils'
import { createEdenTreatyQueryRootHooks, type EdenTreatyQueryRootHooks } from './root-hooks'

export type EdenTreatySvelteQuery<
  TElysia extends AnyElysia,
  TSSRContext,
> = EdenTreatySvelteQueryBase<TElysia, TSSRContext> & EdenTreatyQueryHooks<TElysia>

export type EdenTreatySvelteQueryBase<TElysia extends AnyElysia, TSSRContext> = {
  getContext(): EdenTreatyQueryUtils<TElysia, TSSRContext>

  getUtils(): EdenTreatyQueryUtils<TElysia, TSSRContext>

  createContext(
    props: EdenContextProps<TElysia, TSSRContext>,
    config?: EdenQueryConfig<TElysia>,
  ): EdenContextState<TElysia, TSSRContext>

  createUtils(
    props: EdenContextProps<TElysia, TSSRContext>,
    config?: EdenQueryConfig<TElysia>,
  ): EdenTreatyQueryUtils<TElysia, TSSRContext>

  setContext(
    props: EdenContextProps<TElysia, TSSRContext>,
    config?: EdenQueryConfig<TElysia>,
  ): EdenContextState<TElysia, TSSRContext>

  createClient: EdenCreateClient<TElysia>

  /**
   * Convenience method for creating and configuring a client with a single HTTPLink.
   */
  createHttpClient: (options?: HTTPLinkOptions<TElysia>) => EdenClient<TElysia>

  /**
   * Convenience method for creating and configuring a client with a single HttpBatchLink.
   */
  createHttpBatchClient: (options?: HttpBatchLinkOptions<TElysia>) => EdenClient<TElysia>

  createQueries: EdenTreatyCreateQueries<TElysia>
}

export type EdenTreatyQueryHooks<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatySvelteQueryHooksImplementation<TSchema>
  : 'Please install Elysia before using Eden'

/**
 * Implementation.
 */
export type EdenTreatySvelteQueryHooksImplementation<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? EdenTreatySvelteQueryRouteHooks<TSchema[K], K, TPath>
    : EdenTreatySvelteQueryHooksImplementation<TSchema[K], [...TPath, K]>
}

/**
 * Maps a {@link RouteSchema} to an object with hooks.
 *
 * Defines available hooks for a specific route.
 *
 * @example { createQuery: ..., createInfiniteQuery: ... }
 */
export type EdenTreatySvelteQueryRouteHooks<
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
 * Available hooks assuming that the route supports createQuery.
 */
export type EdenTreatyQueryMapping<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput extends InferRouteOptions<TRoute> = InferRouteOptions<TRoute>,
> = {
  createQuery: EdenCreateQuery<TRoute, TPath>
} & (InfiniteCursorKey extends keyof (TInput['params'] & TInput['query'])
  ? EdenTreatyInfiniteQueryMapping<TRoute, TPath>
  : {})

/**
 * Available hooks assuming that the route supports createInfiniteQuery.
 */
export type EdenTreatyInfiniteQueryMapping<TRoute extends RouteSchema, TPath extends any[] = []> = {
  createInfiniteQuery: EdenCreateInfiniteQuery<TRoute, TPath>
}

/**
 * Available hooks assuming that the route supports createMutation.
 */
export type EdenTreatyMutationMapping<TRoute extends RouteSchema, TPath extends any[] = []> = {
  createMutation: EdenCreateMutation<TRoute, TPath>
}

/**
 * @TODO: Available hooks assuming that the route supports createSubscription.
 */
export type EdenTreatySubscriptionMapping<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
> = {
  options: Prettify<EdenRequestOptions & TInput>
  queryKey: EdenQueryKey<TPath>
}

export function createEdenTreatySvelteQuery<TElysia extends AnyElysia, TSSRContext = unknown>(
  config?: EdenQueryConfig<TElysia>,
): EdenTreatySvelteQuery<TElysia, TSSRContext> {
  const rootHooks = createEdenTreatyQueryRootHooks(config)

  const edenTreatySvelteQueryProxy = createEdenTreatySvelteQueryProxy(rootHooks, config)

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

export function createEdenTreatySvelteQueryProxy<T extends AnyElysia = AnyElysia>(
  rootHooks: EdenTreatyQueryRootHooks<T>,
  config?: EdenQueryConfig<T>,
  paths: string[] = [],
) {
  const edenTreatyQueryProxy = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createEdenTreatySvelteQueryProxy(rootHooks, config, nextPaths)
    },
    apply: (_target, _thisArg, args) => {
      const pathsCopy = [...paths]

      const hook = pathsCopy.pop() ?? ''

      return (rootHooks as any)[hook](pathsCopy, ...args)
    },
  })

  return edenTreatyQueryProxy
}

export * from './create-queries'
export * from './infer'
export * from './query-utils'
export * from './root-hooks'
