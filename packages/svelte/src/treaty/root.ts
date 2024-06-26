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
import { derived, type Readable, readable } from 'svelte/store'

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
    input: StoreOrVal<TInput | SkipToken>,
    options: StoreOrVal<EdenDefinedCreateQueryOptions<TQueryFnData, TData, TError, TOutput>>,
  ): EdenDefinedCreateQueryResult<TData, TError>

  <TQueryFnData extends TOutput = TOutput, TData = TQueryFnData>(
    input: StoreOrVal<TInput | SkipToken>,
    options?: StoreOrVal<EdenCreateQueryOptions<TQueryFnData, TData, TError, TOutput>>,
  ): EdenCreateQueryResult<TData, TError>
}

export type TreatyCreateInfiniteQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteInput<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = (
  input: StoreOrVal<TInput | SkipToken>,
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
) => /**
 * TODO: move this to internal query file.
 */
Readable<
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
      const input = args[0] as StoreOrVal<InferRouteInput>

      /**
       * Additional query options will be provided as the second argument to the `createQuery` call.
       */
      const queryOptions = args[1] as StoreOrVal<EdenCreateQueryOptions<any, any, any>>

      // If both are not stores, then create the query options normally.

      if (!isStore(input) && !isStore(queryOptions)) {
        const treatyQueryOptions = createTreatyQueryOptions(client, options, paths, args)
        return createQuery(treatyQueryOptions)
      }

      // Otherwise, convert both to stores and derive the query options.

      const readableInput = isStore(input) ? input : readable(input)
      const readableQueryOptions = isStore(queryOptions) ? queryOptions : readable(queryOptions)

      const treatyQueryOptions = derived(
        [readableInput, readableQueryOptions],
        ([$input, $queryOptions]) => {
          return createTreatyQueryOptions(client, options, paths, [$input, $queryOptions])
        },
      )

      return createQuery(treatyQueryOptions)
    }

    case 'createInfiniteQuery': {
      /**
       * Main input will be provided as first argument.
       */
      const input = args[0] as StoreOrVal<InferRouteInput>

      /**
       * Additional query options will be provided as the second argument to the `createQuery` call.
       */
      const queryOptions = args[1] as StoreOrVal<EdenCreateInfiniteQueryOptions<any, any, any>>

      // If both are not stores, then create the query options normally.

      if (!isStore(input) && !isStore(queryOptions)) {
        const treatyQueryOptions = createTreatyInfiniteQueryOptions(client, options, paths, args)
        return createInfiniteQuery(treatyQueryOptions)
      }

      // Otherwise, convert both to stores and derive the query options.

      const readableInput = isStore(input) ? input : readable(input)

      const readableQueryOptions = isStore(queryOptions) ? queryOptions : readable(queryOptions)

      const treatyQueryOptions = derived(
        [readableInput, readableQueryOptions],
        ([$input, $queryOptions]) => {
          return createTreatyInfiniteQueryOptions(client, options, paths, [$input, $queryOptions])
        },
      )

      return createInfiniteQuery(treatyQueryOptions)
    }

    case 'createMutation': {
      const mutationOptions = args[0] as StoreOrVal<CreateMutationOptions>

      if (!isStore(mutationOptions)) {
        const treatyMutationOptions = createTreatyMutationOptions(client, options, paths, args)
        return createTreatyMutation(treatyMutationOptions)
      }

      const treatyMutationOptions = derived(mutationOptions, ($mutationOptions) => {
        return createTreatyMutationOptions(client, options, paths, [$mutationOptions])
      })

      return createTreatyMutation(treatyMutationOptions)
    }

    default: {
      throw new TypeError(`eden.${paths.join('.')} is not a function`)
    }
  }
}
