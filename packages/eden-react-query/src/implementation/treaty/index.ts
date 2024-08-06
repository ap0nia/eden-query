import type { EdenCreateClient, EdenRequestOptions, InferRouteOptions } from '@elysiajs/eden'
import type {
  HttpMutationMethod,
  HttpQueryMethod,
  HttpSubscriptionMethod,
} from '@elysiajs/eden/http.ts'
import type { AnyElysia, RouteSchema } from 'elysia'
import type { Prettify } from 'elysia/types'
import { useMemo } from 'react'

import type { EdenQueryConfig } from '../../config'
import type { EdenContextProps, EdenContextState, EdenProvider } from '../../context'
import type { EdenUseInfiniteQuery } from '../../integration/hooks/use-infinite-query'
import type { EdenUseMutation } from '../../integration/hooks/use-mutation'
import type { EdenUseQuery } from '../../integration/hooks/use-query'
import type { InfiniteCursorKey } from '../../integration/internal/infinite-query'
import type { EdenQueryKey } from '../../integration/internal/query-key'
import { createEdenTreatyQueryUtils, type EdenTreatyQueryUtils } from './query-utils'
import { createEdenTreatyQueryRootHooks, type EdenTreatyQueryRootHooks } from './root-hooks'
import type { EdenTreatyUseQueries } from './use-queries'
import type { EdenTreatyUseSuspenseQueries } from './use-suspense-queries'

const useContextAliases = ['useContext', 'useUtils']

export type EdenTreatyQuery<TElysia extends AnyElysia, TSSRContext> = EdenTreatyQueryBase<
  TElysia,
  TSSRContext
> &
  EdenTreatyQueryHooks<TElysia>

export type EdenTreatyQueryBase<TElysia extends AnyElysia, TSSRContext> = {
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

  createContext(
    props: EdenContextProps<TElysia, TSSRContext>,
  ): EdenContextState<TElysia, TSSRContext>

  createUtils(
    context: EdenContextProps<TElysia, TSSRContext>,
  ): EdenTreatyQueryUtils<TElysia, TSSRContext>

  Provider: EdenProvider<TElysia, TSSRContext>

  createClient: EdenCreateClient<TElysia>

  useQueries: EdenTreatyUseQueries<TElysia>

  useSuspenseQueries: EdenTreatyUseSuspenseQueries<TElysia>
}

export type EdenTreatyQueryHooks<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatyQueryHooksImplementation<TSchema>
  : 'Please install Elysia before using Eden'

/**
 * Implementation.
 */
export type EdenTreatyQueryHooksImplementation<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? EdenTreatyQueryRouteHooks<TSchema[K], K, TPath>
    : EdenTreatyQueryHooksImplementation<TSchema[K], [...TPath, K]>
}

/**
 * Maps a {@link RouteSchema} to an object with hooks.
 *
 * Defines available hooks for a specific route.
 *
 * @example { createQuery: ..., createInfiniteQuery: ... }
 */
export type EdenTreatyQueryRouteHooks<
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
 * Available hooks gassumingthat the route supports createQuery.
 */
export type EdenTreatyQueryMapping<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput extends InferRouteOptions<TRoute> = InferRouteOptions<TRoute>,
> = {
  useQuery: EdenUseQuery<TRoute, TPath>
} & (InfiniteCursorKey extends keyof (TInput['params'] & TInput['query'])
  ? EdenTreatyInfiniteQueryMapping<TRoute, TPath>
  : {})

/**
 * Available hooks assuming that the route supports createInfiniteQuery.
 */
export type EdenTreatyInfiniteQueryMapping<TRoute extends RouteSchema, TPath extends any[] = []> = {
  useInfiniteQuery: EdenUseInfiniteQuery<TRoute, TPath>
}

/**
 * Available hooks assuming that the route supports createMutation.
 */
export type EdenTreatyMutationMapping<TRoute extends RouteSchema, TPath extends any[] = []> = {
  useMutation: EdenUseMutation<TRoute, TPath>
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

export function createEdenTreatyQuery<TElysia extends AnyElysia, TSSRContext = unknown>(
  config?: EdenQueryConfig<TElysia>,
): EdenTreatyQuery<TElysia, TSSRContext> {
  const rootHooks = createEdenTreatyQueryRootHooks(config)

  const edenTreatyReactQueryProxy = createEdenTreatyQueryProxy(rootHooks, config)

  const edenTreatyQuery = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      if (useContextAliases.includes(path)) {
        const customUseContext = (context = rootHooks.useUtils()) => {
          // Create and return a stable reference of the utils context.
          return useMemo(() => createEdenTreatyQueryUtils(context), [context])
        }
        return customUseContext
      }

      if (Object.prototype.hasOwnProperty.call(rootHooks, path)) {
        return rootHooks[path as never]
      }

      return edenTreatyReactQueryProxy[path as never]
    },
  })

  return edenTreatyQuery as any
}

export function createEdenTreatyQueryProxy<T extends AnyElysia = AnyElysia>(
  rootHooks: EdenTreatyQueryRootHooks<T>,
  config?: EdenQueryConfig<T>,
  paths: string[] = [],
) {
  const edenTreatyQueryProxy = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createEdenTreatyQueryProxy(rootHooks, config, nextPaths)
    },
    apply: (_target, _thisArg, args) => {
      const pathsCopy = [...paths]

      const hook = pathsCopy.pop() ?? ''

      return (rootHooks as any)[hook](pathsCopy, ...args)
    },
  })

  return edenTreatyQueryProxy
}

export * from './infer'
export * from './root-hooks'
export * from './use-queries'
export * from './use-suspense-queries'
