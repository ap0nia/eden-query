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
  TRouteParams = ExtractEdenTreatyRouteParams<TSchema>,
> = {
  [K in Exclude<keyof TSchema, keyof TRouteParams>]: TSchema[K] extends RouteSchema
    ? EdenTreatySvelteQueryRouteHooks<TSchema[K], K, TPath>
    : EdenTreatySvelteQueryHooksImplementation<TSchema[K], [...TPath, K]>
} & ({} extends TRouteParams
  ? {}
  : (
      params: StoreOrVal<ExtractEdenTreatyRouteParamsInput<TRouteParams>>,
    ) => EdenTreatySvelteQueryHooksImplementation<
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
      : `Unknown HTTP Method: ${TMethod & string}`

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
  pathParams: StoreOrVal<Record<string, any>>[] = [],
) {
  const edenTreatyQueryProxy = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createEdenTreatySvelteQueryProxy(rootHooks, config, nextPaths, pathParams)
    },
    apply: (_target, _thisArg, args) => {
      const pathsCopy = [...paths]

      const hook = pathsCopy.pop() ?? ''

      const pathParam = getPathParam(args)

      if (pathParam?.key != null) {
        const allPathParams = [...pathParams, pathParam.param]
        const pathsWithParams = [...paths, `:${pathParam.key}`]
        return createEdenTreatySvelteQueryProxy(rootHooks, config, pathsWithParams, allPathParams)
      }

      // There is no option to pass in input from the public exposed hook,
      // but the internal root `createMutation` hook expects input as the first argument.
      // Add an empty element at the front representing "input".
      if (hook === 'createMutation') {
        args.unshift(undefined)
      }

      const modifiedArgs = mutateArgs(hook, args, pathParams)

      return (rootHooks as any)[hook](pathsCopy, ...modifiedArgs)
    },
  })

  return edenTreatyQueryProxy
}

export function getQueryKey<TSchema extends Record<string, any>>(
  route: EdenTreatySvelteQueryHooksImplementation<TSchema>,
  input?: TSchema extends RouteSchema ? InferRouteOptions<TSchema> : any,
  type?: EdenQueryType,
): EdenQueryKey {
  const paths = (route as any).defs()
  return internalGetQueryKey(paths, input, type ?? 'any')
}

export function getMutationKey<TSchema extends RouteSchema>(
  route: EdenTreatySvelteQueryHooksImplementation<TSchema>,
  options?: EdenQueryKeyOptions,
): EdenMutationKey {
  const paths = (route as any).defs()
  return internalGetMutationKey(paths, options)
}

export * from './create-queries'
export * from './infer'
export * from './query-utils'
export * from './root-hooks'
