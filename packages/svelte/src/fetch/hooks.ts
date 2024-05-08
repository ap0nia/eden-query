import type {
  CreateBaseMutationResult,
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  CreateMutationOptions,
  CreateQueryOptions,
  CreateQueryResult,
  InfiniteData,
  MutateOptions,
  StoreOrVal,
} from '@tanstack/svelte-query'
import type { Readable } from 'svelte/store'

import type { HttpMutationMethod, HttpQueryMethod } from '../internal/http'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import type { InfiniteRoutes, ReservedInfiniteQueryKeys } from '../internal/infinite'
import type { EdenRequestOptions } from '../internal/options'
import type { Filter } from '../utils/filter'
import type { Override } from '../utils/override'

export type EdenFetchQueryHooks<TSchema extends Record<string, any>> = {
  createQuery: <
    TEndpoint extends keyof Filter<TSchema, HttpQueryMethod>,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpQueryMethod>>,
    TRoute extends TSchema[TEndpoint][Lowercase<TMethod>],
    TInput = InferRouteInput<TRoute>,
    TOutput = InferRouteOutput<TRoute>,
    TError = InferRouteError<TRoute>,
  >(
    endpoint: TEndpoint,
    options: StoreOrVal<
      EdenRequestOptions<TMethod, TRoute> & {
        queryOptions?: Omit<
          CreateQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>,
          'queryKey'
        >
      }
    >,
  ) => CreateQueryResult<TOutput, TError>

  createInfiniteQuery: <
    TEndpoint extends keyof InfiniteRoutes<TSchema>,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpQueryMethod>>,
    TRoute extends TSchema[TEndpoint][Lowercase<TMethod>],
    TInput = InferRouteInput<TRoute, ReservedInfiniteQueryKeys>,
    TOutput = InferRouteOutput<TRoute>,
    TError = InferRouteError<TRoute>,
  >(
    endpoint: TEndpoint,
    options: StoreOrVal<
      EdenRequestOptions<TMethod, TRoute, ReservedInfiniteQueryKeys> & {
        queryOptions: Omit<
          CreateInfiniteQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>,
          'queryKey'
        >
      }
    >,
  ) => CreateInfiniteQueryResult<InfiniteData<TOutput>, TError>

  createMutation: <
    TEndpoint extends keyof Filter<TSchema, HttpMutationMethod>,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpMutationMethod>>,
    TRoute extends TSchema[TEndpoint][Lowercase<TMethod>],
    TInput = EdenRequestOptions<TMethod, TRoute>,
    TOutput = InferRouteOutput<TRoute>,
    TError = InferRouteError<TRoute>,
    /**
     * TODO: what is TContext for a fetch request mutation?
     */
    TContext = unknown,
  >(
    endpoint: TEndpoint,
    options?: CreateMutationOptions<TOutput, TError, TInput, TContext>,
  ) => Readable<
    // Override the default `mutate` and `mutateAsync` properties to properly resolve
    // duplicate endpoints with different methods.
    Override<
      CreateBaseMutationResult<TOutput, TError, TInput, TContext>,
      {
        mutateAsync: EdenFetchAsyncMutationFunction<TSchema, TEndpoint, TContext>
        mutate: EdenFetchMutationFunction<TSchema, TEndpoint, TContext>
      }
    >
  >
}

export type EdenFetchAsyncMutationFunction<
  TSchema extends Record<string, any>,
  TEndpoint extends keyof TSchema,
  TContext = any,
> = <
  TResolvedMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpMutationMethod>>,
  TResolvedRoute extends TSchema[TEndpoint][Lowercase<TResolvedMethod>],
  TResolvedOutput = InferRouteOutput<TResolvedRoute>,
  TResolvedError = InferRouteError<TResolvedRoute>,
>(
  variables: EdenRequestOptions<TResolvedMethod, TResolvedRoute>,
  options?: MutateOptions<
    TResolvedOutput,
    TResolvedError,
    EdenRequestOptions<TResolvedMethod, TResolvedRoute>,
    TContext
  >,
) => Promise<TResolvedOutput>

export type EdenFetchMutationFunction<
  TSchema extends Record<string, any>,
  TEndpoint extends keyof TSchema,
  TContext = any,
> = <
  TResolvedMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpMutationMethod>>,
  TResolvedRoute extends TSchema[TEndpoint][Lowercase<TResolvedMethod>],
  TResolvedOutput = InferRouteOutput<TResolvedRoute>,
  TResolvedError = InferRouteError<TResolvedRoute>,
>(
  variables: EdenRequestOptions<TResolvedMethod, TResolvedRoute>,
  options?: MutateOptions<
    TResolvedOutput,
    TResolvedError,
    EdenRequestOptions<TResolvedMethod, TResolvedRoute>,
    TContext
  >,
) => void
