import {
  type CreateBaseMutationResult,
  createInfiniteQuery,
  createQuery,
  type MutateOptions,
  type SkipToken,
  type StoreOrVal,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'
import type { Prettify } from 'elysia/types'
import { derived, type Readable } from 'svelte/store'

import type { EdenClient } from '../internal/client'
import type { HttpMutationMethod, HttpQueryMethod, HttpSubscriptionMethod } from '../internal/http'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import {
  type CreateMutationOptions,
  createTreatyInfiniteQueryOptions,
  createTreatyMutation,
  createTreatyMutationOptions,
  createTreatyQueryOptions,
  type EdenCreateInfiniteQueryOptions,
  type EdenCreateInfiniteQueryResult,
  type EdenCreateMutationOptions,
  type EdenCreateQueryOptions,
  type EdenCreateQueryResult,
  type EdenDefinedCreateQueryOptions,
  type EdenDefinedCreateQueryResult,
  type EdenQueryKey,
  type EdenQueryRequestOptions,
  type InfiniteCursorKey,
} from '../internal/query'
import type { EdenRequestOptions } from '../internal/request'
import type { AnyElysia, InstallMessage } from '../types'
import { isStore } from '../utils/is-store'
import { noop } from '../utils/noop'
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

export interface TreatyCreateQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteInput<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> {
  <TQueryFnData extends TOutput = TOutput, TData = TQueryFnData>(
    input: TInput | SkipToken,
    options: StoreOrVal<EdenDefinedCreateQueryOptions<TQueryFnData, TData, TError, TOutput>>,
  ): EdenDefinedCreateQueryResult<TData, TError>

  <TQueryFnData extends TOutput = TOutput, TData = TQueryFnData>(
    input: TInput | SkipToken,
    opts?: EdenCreateQueryOptions<TQueryFnData, TData, TError, TOutput>,
  ): EdenCreateQueryResult<TData, TError>
}

export type TreatyCreateInfiniteQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteInput<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = (
  input: TInput | SkipToken,
  options: StoreOrVal<EdenCreateInfiniteQueryOptions<TInput, TOutput, TError>>,
) => EdenCreateInfiniteQueryResult<TOutput, TError, TInput>

export type EdenTreatyCreateMutation<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteInput<TRoute>['body'],
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = <TContext = unknown>(
  options?: StoreOrVal<EdenCreateMutationOptions<TInput, TOutput, TError, TContext>>,
) => Readable<
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
> = <TContext = unknown>(
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
> = <TContext = unknown>(
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
  client: EdenClient,
  options?: EdenQueryRequestOptions,
  paths: any[] = [],
): any {
  const innerProxy: any = new Proxy(noop, {
    get: (_, path: string): any => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createEdenTreatyQueryProxyRoot(client, options, nextPaths)
    },
    apply: (_, __, args) => {
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
  paths: string[] = [],
  args: any[] = [],
) {
  /**
   * @example 'createQuery'
   */
  const hook = paths.pop()

  switch (hook) {
    case 'createQuery': {
      const typedOptions = args[0] as StoreOrVal<EdenCreateQueryOptions<any, any, any>>

      if (!isStore(typedOptions)) {
        const queryOptions = createTreatyQueryOptions(client, options, paths, args)
        return createQuery(queryOptions)
      }

      const optionsStore = derived(typedOptions, ($typedOptions) => {
        const newQueryOptions = createTreatyQueryOptions(client, options, paths, [$typedOptions])
        return { ...$typedOptions, ...newQueryOptions }
      })

      return createQuery(optionsStore)
    }

    case 'createInfiniteQuery': {
      const typedOptions = args[0] as StoreOrVal<EdenCreateInfiniteQueryOptions<any, any, any>>

      if (!isStore(typedOptions)) {
        const queryOptions = createTreatyInfiniteQueryOptions(client, options, paths, args)
        return createInfiniteQuery(queryOptions)
      }

      const optionsStore = derived(typedOptions, ($typedOptions) => {
        const newOptions = createTreatyInfiniteQueryOptions(client, options, paths, [$typedOptions])
        return { ...$typedOptions, ...newOptions }
      })

      return createInfiniteQuery(optionsStore)
    }

    case 'createMutation': {
      const typedOptions = args[0] as StoreOrVal<CreateMutationOptions>

      if (!isStore(typedOptions)) {
        const mutationOptions = createTreatyMutationOptions(client, options, paths, args)
        return createTreatyMutation(mutationOptions)
      }

      const optionsStore = derived(typedOptions, ($typedOptions) => {
        const newOptions = createTreatyMutationOptions(client, options, paths, [$typedOptions])
        return { ...$typedOptions, ...newOptions }
      })

      return createTreatyMutation(optionsStore)
    }

    default: {
      throw new TypeError(`eden.${paths.join('.')} is not a function`)
    }
  }
}
