import type {
  CreateBaseMutationResult,
  CreateInfiniteQueryResult,
  CreateQueryResult,
  InfiniteData,
  MutateOptions,
  StoreOrVal,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'
import type { Prettify } from 'elysia/types'
import type { Readable } from 'svelte/store'

import type { EdenResolveOptions } from '../internal/config'
import type { HttpMutationMethod, HttpQueryMethod, HttpSubscriptionMethod } from '../internal/http'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import type {
  EdenCreateInfiniteQueryOptions,
  EdenCreateMutationOptions,
  EdenCreateQueryOptions,
  EdenQueryKey,
  InfiniteCursorKey,
} from '../internal/query'
import type { Override } from '../utils/override'

/**
 * The root proxy maps Elysia._routes to svelte-query hooks.
 */
export type EdenTreatyQueryRoot<TSchema extends Record<string, any>, TPath extends any[] = []> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? TreatyQueryRootMapping<TSchema[K], K, TPath>
    : EdenTreatyQueryRoot<TSchema[K], [...TPath, K]>
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
  TInput extends InferRouteInput<TRoute> = InferRouteInput<TRoute>,
> = {
  options: Prettify<EdenResolveOptions & TInput>
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
