import type { EdenClient, EdenRequestOptions, InferRouteOptions } from '@elysiajs/eden'
import type {
  HttpMutationMethod,
  HttpQueryMethod,
  HttpSubscriptionMethod,
} from '@elysiajs/eden/http.ts'
import type { AnyElysia, RouteSchema } from 'elysia'
import type { Prettify } from 'elysia/types'
import { derived, readable } from 'svelte/store'

import type { EdenQueryKey } from './query-key'
import type { EdenQueryRequestOptions } from './request'
import type { InfiniteCursorKey } from './use-infinite-query'
import type { EdenUseMutation } from './use-mutation'
import type { EdenUseQuery } from './use-query'

/**
 * The root proxy maps Elysia._routes to svelte-query hooks.
 */
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
  createQuery: EdenUseQuery<TRoute, TPath>
} & (InfiniteCursorKey extends keyof (TInput['params'] & TInput['query'])
  ? EdenTreatyInfiniteQueryMapping<TRoute, TPath>
  : {})

/**
 * Available hooks assuming that the route supports createInfiniteQuery.
 */
export type EdenTreatyInfiniteQueryMapping<TRoute extends RouteSchema, TPath extends any[] = []> = {
  createInfiniteQuery: EdenUseInfiniteQuery<TRoute, TPath>
}

/**
 * Available hooks assuming that the route supports createMutation.
 */
export type EdenTreatyMutationMapping<TRoute extends RouteSchema, TPath extends any[] = []> = {
  createMutation: EdenUseMutation<TRoute, TPath>
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

/**
 * Inner proxy.
 */
export function createEdenTreatyQueryProxyRoot(
  client: EdenClient,
  options?: EdenQueryRequestOptions,
  paths: any[] = [],
): any {
  const innerProxy: any = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createEdenTreatyQueryProxyRoot(client, options, nextPaths)
    },
    apply: (_target, _thisArg, args) => {
      return resolveEdenTreatyQueryProxy(client, options, [...paths], args)
    },
  })

  return innerProxy
}

/**
 * GET hooks will only have one parameter: options.
 * eden.api.hello.get.createQuery(options)
 *
 * POST, etc. hooks will also only have one parameter: options.
 * They add body when calling `mutate` or `mutateAsync`
 *
 * const mutation = eden.api.hello.post.createMutation(options)
 * mutation.mutate(body)
 */
export function resolveEdenTreatyQueryProxy(
  client: EdenClient,
  options?: EdenQueryRequestOptions,
  originalPaths: string[] = [],
  args: any[] = [],
) {
  const paths = [...originalPaths]

  /**
   * @example 'createQuery'
   */
  const hook = paths.pop()

  switch (hook) {
    case 'createQuery': {
      /**
       * Main input will be provided as first argument.
       */
      const input = args[0] as StoreOrVal<InferRouteOptions>

      /**
       * Additional query options will be provided as the second argument to the `createQuery` call.
       */
      const queryOptions = args[1] as StoreOrVal<EdenCreateQueryOptions<any, any, any>>

      // If both are not stores, then create the query options normally.

      if (!isStore(input) && !isStore(queryOptions)) {
        const treatyQueryOptions = createEdenQueryOptions(client, options, paths, args)
        return createQuery(treatyQueryOptions)
      }

      // Otherwise, convert both to stores and derive the query options.

      const readableInput = isStore(input) ? input : readable(input)
      const readableQueryOptions = isStore(queryOptions) ? queryOptions : readable(queryOptions)

      const treatyQueryOptions = derived(
        [readableInput, readableQueryOptions],
        ([$input, $queryOptions]) => {
          return createEdenQueryOptions(client, options, paths, [$input, $queryOptions])
        },
      )

      return createQuery(treatyQueryOptions)
    }

    case 'createInfiniteQuery': {
      /**
       * Main input will be provided as first argument.
       */
      const input = args[0] as StoreOrVal<InferRouteOptions>

      /**
       * Additional query options will be provided as the second argument to the `createQuery` call.
       */
      const queryOptions = args[1] as StoreOrVal<EdenCreateInfiniteQueryOptions<any, any, any>>

      // If both are not stores, then create the query options normally.

      if (!isStore(input) && !isStore(queryOptions)) {
        const treatyQueryOptions = createEdenInfiniteQueryOptions(client, options, paths, args)
        return createInfiniteQuery(treatyQueryOptions)
      }

      // Otherwise, convert both to stores and derive the query options.

      const readableInput = isStore(input) ? input : readable(input)

      const readableQueryOptions = isStore(queryOptions) ? queryOptions : readable(queryOptions)

      const treatyQueryOptions = derived(
        [readableInput, readableQueryOptions],
        ([$input, $queryOptions]) => {
          return createEdenInfiniteQueryOptions(client, options, paths, [$input, $queryOptions])
        },
      )

      return createInfiniteQuery(treatyQueryOptions)
    }

    case 'createMutation': {
      const mutationOptions = args[0] as StoreOrVal<CreateMutationOptions>

      if (!isStore(mutationOptions)) {
        const treatyMutationOptions = createEdenMutationOptions(client, options, paths, args)
        return createEdenMutation(treatyMutationOptions)
      }

      const treatyMutationOptions = derived(mutationOptions, ($mutationOptions) => {
        return createEdenMutationOptions(client, options, paths, [$mutationOptions])
      })

      return createEdenMutation(treatyMutationOptions)
    }

    default: {
      throw new TypeError(`eden.${paths.join('.')} is not a function`)
    }
  }
}
