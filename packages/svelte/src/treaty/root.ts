import {
  type CreateBaseMutationResult,
  createInfiniteQuery,
  type CreateInfiniteQueryResult,
  type CreateMutationOptions,
  createQuery,
  type CreateQueryResult,
  type InfiniteData,
  type MutateOptions,
  type StoreOrVal,
} from '@tanstack/svelte-query'
import type { Elysia, RouteSchema } from 'elysia'
import type { Prettify } from 'elysia/types'
import { derived, type Readable } from 'svelte/store'

import type { EdenQueryConfig, EdenRequestOptions } from '../internal/config'
import type { HttpMutationMethod, HttpQueryMethod, HttpSubscriptionMethod } from '../internal/http'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import {
  createTreatyInfiniteQueryOptions,
  createTreatyMutation,
  createTreatyMutationOptions,
  createTreatyQueryOptions,
  type EdenCreateInfiniteQueryOptions,
  type EdenCreateMutationOptions,
  type EdenCreateQueryOptions,
  type EdenQueryKey,
  type InfiniteCursorKey,
} from '../internal/query'
import type { AnyElysia, InstallMessage } from '../types'
import { isStore } from '../utils/is-store'
import type { Override } from '../utils/override'

/**
 * The root proxy maps Elysia._routes to svelte-query hooks.
 */
export type EdenTreatyQueryRoot<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatyQueryRootMapping<TSchema>
  : InstallMessage

/**
 * Implementation.
 */
export type EdenTreatyQueryRootMapping<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? TreatyQueryRootMapping<TSchema[K], K, TPath>
    : EdenTreatyQueryRootMapping<TSchema[K], [...TPath, K]>
}

/**
 * Map a {@link RouteSchema} to an object with hooks.
 * @example { createQuery: ..., createInfiniteQuery: ... }
 */
export type TreatyQueryRootMapping<
  TRoute extends RouteSchema,
  TMethod,
  TPath extends any[] = [],
> = TMethod extends HttpQueryMethod
  ? TreatyQueryMapping<TRoute, TPath>
  : TMethod extends HttpMutationMethod
  ? TreatyMutationMapping<TRoute, TPath>
  : TMethod extends HttpSubscriptionMethod
  ? TreatySubscriptionMapping<TRoute, TPath>
  : never

/**
 * Hooks for a query procedure.
 */
export type TreatyQueryMapping<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput extends InferRouteInput<TRoute> = InferRouteInput<TRoute>,
> = {
  createQuery: TreatyCreateQuery<TRoute, TPath>
} & (InfiniteCursorKey extends keyof (TInput['params'] & TInput['query'])
  ? TreatyInfiniteQueryMapping<TRoute, TPath>
  : {})

/**
 * Hooks for an infinite-query procedure.
 */
export type TreatyInfiniteQueryMapping<TRoute extends RouteSchema, TPath extends any[] = []> = {
  createInfiniteQuery: TreatyCreateInfiniteQuery<TRoute, TPath>
}

/**
 * Hooks for a mutation procedure.
 */
export type TreatyMutationMapping<TRoute extends RouteSchema, TPath extends any[] = []> = {
  createMutation: EdenTreatyCreateMutation<TRoute, TPath>
}

/**
 * TODO: Hooks for a subscription procedure.
 */
export type TreatySubscriptionMapping<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteInput<TRoute>,
> = {
  options: Prettify<EdenRequestOptions & TInput>
  queryKey: EdenQueryKey<TPath>
}

export type TreatyCreateQuery<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = (
  options: StoreOrVal<EdenCreateQueryOptions<TRoute, TPath>>,
) => CreateQueryResult<TOutput, TError>

export type TreatyCreateInfiniteQuery<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = (
  options: StoreOrVal<EdenCreateInfiniteQueryOptions<TRoute, TPath>>,
) => CreateInfiniteQueryResult<InfiniteData<TOutput>, TError>

export type EdenTreatyCreateMutation<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteInput<TRoute>['body'],
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  /**
   * TODO: what is TContext for a fetch request mutation?
   */
  TContext = unknown,
> = (options?: StoreOrVal<EdenCreateMutationOptions<TRoute, TPath>>) => Readable<
  Override<
    CreateBaseMutationResult<TOutput, TError, TInput, TContext>,
    {
      mutateAsync: EdenTreatyAsyncMutationFunction<TRoute>
      mutate: EdenTreatyMutationFunction<TRoute>
    }
  >
>

export type EdenTreatyAsyncMutationFunction<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput extends Record<string, any> = InferRouteInput<TRoute>,
  TBody = TInput['body'],
  TParams = Omit<TInput, 'body'>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  /**
   * TODO: what is TContext for a fetch request mutation?
   */
  TContext = unknown,
> = (
  variables: TBody,
  ...args: {} extends TParams
    ? [options?: TParams & MutateOptions<TOutput, TError, TBody, TContext>]
    : [options: TParams & MutateOptions<TOutput, TError, TBody, TContext>]
) => Promise<TOutput>

export type EdenTreatyMutationFunction<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput extends Record<string, any> = InferRouteInput<TRoute>,
  TBody = TInput['body'],
  TParams = Omit<TInput, 'body'>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  /**
   * TODO: what is TContext for a fetch request mutation?
   */
  TContext = unknown,
> = (
  variables: TBody,
  ...args: {} extends TParams
    ? [options?: TParams & MutateOptions<TOutput, TError, TBody, TContext>]
    : [options: TParams & MutateOptions<TOutput, TError, TBody, TContext>]
) => void

/**
 * Inner proxy. __Does not recursively create more proxies!__
 *
 * Once the first property has been decided from the top-level proxy,
 * future property accesses will mutate a locally scoped array.
 */
export function createEdenTreatyQueryProxyRoot(
  domain?: string,
  config: EdenQueryConfig = {},
  elysia?: Elysia<any, any, any, any, any, any>,
  paths: any[] = [],
): any {
  const innerProxy: any = new Proxy(() => {}, {
    get: (_, path: string): any => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createEdenTreatyQueryProxyRoot(domain, config, elysia, nextPaths)
    },
    apply: (_, __, args) => {
      return resolveEdenTreatyQueryProxy(args, domain, config, [...paths], elysia)
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
  args: any[],
  domain?: string,
  config: EdenQueryConfig = {},
  paths: string[] = [],
  elysia?: Elysia<any, any, any, any, any, any>,
) {
  /**
   * @example 'createQuery'
   */
  const hook = paths.pop()

  switch (hook) {
    case 'createQuery': {
      const typedOptions = args[0] as StoreOrVal<EdenCreateQueryOptions<any>>

      if (!isStore(typedOptions)) {
        const queryOptions = createTreatyQueryOptions(paths, args, domain, config, elysia)
        return createQuery(queryOptions)
      }

      const optionsStore = derived(typedOptions, ($typedOptions) => {
        args[0] = $typedOptions
        const newQueryOptions = createTreatyQueryOptions(paths, args, domain, config, elysia)
        return { ...$typedOptions, ...newQueryOptions }
      })

      return createQuery(optionsStore)
    }

    case 'createInfiniteQuery': {
      const typedOptions = args[0] as StoreOrVal<EdenCreateInfiniteQueryOptions<any>>

      if (!isStore(typedOptions)) {
        const queryOptions = createTreatyInfiniteQueryOptions(paths, args, domain, config, elysia)
        return createInfiniteQuery(queryOptions)
      }

      const optionsStore = derived(typedOptions, ($typedOptions) => {
        args[0] = $typedOptions
        const newOptions = createTreatyInfiniteQueryOptions(paths, args, domain, config, elysia)
        return { ...$typedOptions, ...newOptions }
      })

      return createInfiniteQuery(optionsStore)
    }

    case 'createMutation': {
      const typedOptions = args[0] as CreateMutationOptions

      if (!isStore(typedOptions)) {
        const mutationOptions = createTreatyMutationOptions(paths, args, domain, config, elysia)
        return createTreatyMutation(mutationOptions)
      }

      const optionsStore = derived(typedOptions, ($typedOptions) => {
        args[0] = $typedOptions
        const newOptions = createTreatyMutationOptions(paths, args, domain, config, elysia)
        return { ...$typedOptions, ...newOptions }
      })

      return createTreatyMutation(optionsStore)
    }

    // TODO: not sure how to handle subscriptions.
    // case 'createSubscription': {
    //   return client.subscription(path, anyArgs[0], anyArgs[1])
    // }

    default: {
      throw new TypeError(`eden.${paths.join('.')} is not a function`)
    }
  }
}
