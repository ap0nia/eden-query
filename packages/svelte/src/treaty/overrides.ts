import type {
  CreateBaseMutationResult,
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  CreateQueryOptions,
  CreateQueryResult,
  InfiniteData,
  MutateOptions,
  MutationObserverOptions,
  OmitKeyof,
  StoreOrVal,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'
import type { Readable } from 'svelte/store'

import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import type { ReservedInfiniteQueryKeys } from '../internal/infinite'
import type { EdenQueryProxyConfig } from '../internal/options'
import type { EdenQueryParams } from '../internal/params'
import type { Override } from '../utils/override'
import type { TreatyQueryKey } from './types'

export type TreatyCreateQuery<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TParams extends EdenQueryParams<any, TRoute> = EdenQueryParams<any, TRoute>,
  TInput = InferRouteInput<TRoute, ReservedInfiniteQueryKeys>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TEndpoint = TreatyQueryKey<TPath>,
> = (
  options: StoreOrVal<
    TParams & {
      eden?: EdenQueryProxyConfig
      queryOptions?: Omit<
        CreateQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>,
        'queryKey'
      >
    }
  >,
) => CreateQueryResult<TOutput, TError>

export type TreatyCreateInfiniteQuery<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TParams extends EdenQueryParams<any, TRoute> = EdenQueryParams<any, TRoute>,
  TInput = InferRouteInput<TRoute, ReservedInfiniteQueryKeys>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TEndpoint = TreatyQueryKey<TPath>,
> = (
  options: StoreOrVal<
    TParams & {
      eden?: EdenQueryProxyConfig
      queryOptions: Omit<
        CreateInfiniteQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>,
        'queryKey'
      >
    }
  >,
) => CreateInfiniteQueryResult<InfiniteData<TOutput>, TError>

export type EdenTreatyMutation<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput extends Record<string, any> = EdenQueryParams<any, TRoute>,
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

export type EdenTreatyCreateMutation<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = EdenQueryParams<any, TRoute>['body'],
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  /**
   * TODO: what is TContext for a fetch request mutation?
   */
  TContext = unknown,
> = (
  options?: StoreOrVal<
    OmitKeyof<MutationObserverOptions<TOutput, TError, TInput, TContext>, '_defaulted'> & TInput
  >,
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
  TInput extends Record<string, any> = EdenQueryParams<any, TRoute>,
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
  TInput extends Record<string, any> = EdenQueryParams<any, TRoute>,
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
