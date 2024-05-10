import type {
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  CreateMutationOptions,
  CreateMutationResult,
  CreateQueryOptions,
  CreateQueryResult,
  InfiniteData,
  StoreOrVal,
} from '@tanstack/svelte-query'
import type { MaybeArray, MaybePromise, Prettify, RouteSchema } from 'elysia/types'

import type { HttpMutationMethod, HttpQueryMethod, HttpSubscriptionMethod } from '../internal/http'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import type { InfiniteCursorKey, ReservedInfiniteQueryKeys } from '../internal/infinite'
import type { SvelteQueryProxyConfig } from '../internal/options'
import type { EdenQueryParams } from '../internal/params'
import type { Join, Stringable } from '../utils/join'

export type EdenTreatyQueryConfig = TreatyConfig & SvelteQueryProxyConfig

/**
 * Additional options available for the `treaty` variant of eden.
 */
export interface TreatyBaseOptions {
  fetch?: RequestInit
}

/**
 * The wrapper type.
 */
export type EdenTreatyQueryHooks<TSchema extends Record<string, any>, TPath extends any[] = []> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? TreatyQueryHooksMapping<TSchema[K], K, TPath>
    : EdenTreatyQueryHooks<TSchema[K], [...TPath, K]>
}

export interface TreatyConfig {
  fetch?: Omit<RequestInit, 'headers' | 'method'>
  fetcher?: typeof fetch
  headers?: MaybeArray<
    RequestInit['headers'] | ((path: string, options: RequestInit) => RequestInit['headers'] | void)
  >
  onRequest?: MaybeArray<(path: string, options: RequestInit) => MaybePromise<RequestInit | void>>
  onResponse?: MaybeArray<(response: Response) => MaybePromise<unknown>>
  keepDomain?: boolean
}

/**
 * The actual hooks mapping.
 *
 * @example { createQuery: ..., createInfiniteQuery: ... }
 */
export type TreatyQueryHooksMapping<
  TRoute extends RouteSchema,
  TMethod,
  TPath extends any[] = [],
> = TMethod extends HttpQueryMethod
  ? TreatyCreateQuery<TRoute, TPath>
  : TMethod extends HttpMutationMethod
  ? TreatyCreateMutation<TRoute, TPath>
  : TMethod extends HttpSubscriptionMethod
  ? TreatyCreateSubscription<TRoute, TPath>
  : never

export type TreatyCreateQuery<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TParams extends EdenQueryParams<any, TRoute> = EdenQueryParams<any, TRoute>,
  TInput = InferRouteInput<TRoute, ReservedInfiniteQueryKeys>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TEndpoint = TreatyQueryKey<TPath>,
> = {
  createQuery: (
    options: StoreOrVal<
      TParams & {
        queryOptions?: Omit<
          CreateQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>,
          'queryKey'
        >
      }
    >,
  ) => CreateQueryResult<TOutput, TError>
} & (InfiniteCursorKey extends keyof (TParams['params'] & TParams['query'])
  ? TreatyCreateInfiniteQuery<TRoute, TPath>
  : {})

export type TreatyCreateInfiniteQuery<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TParams extends EdenQueryParams<any, TRoute, ReservedInfiniteQueryKeys> = EdenQueryParams<
    any,
    TRoute
  >,
  TInput = InferRouteInput<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TEndpoint = TreatyQueryKey<TPath>,
> = {
  createInfiniteQuery: (
    options: StoreOrVal<
      TParams & {
        queryOptions: Omit<
          CreateInfiniteQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>,
          'queryKey'
        >
      }
    >,
  ) => CreateInfiniteQueryResult<InfiniteData<TOutput>, TError>
}

export type TreatyCreateMutation<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = EdenQueryParams<any, TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  /**
   * TODO: what is TContext for a fetch request mutation?
   */
  TContext = unknown,
> = {
  createMutation: (
    options?: CreateMutationOptions<TOutput, TError, TInput, TContext>,
  ) => CreateMutationResult<TOutput, TError, TInput, TContext>
}

/**
 * TODO
 */
export type TreatyCreateSubscription<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TParams extends EdenQueryParams<any, TRoute> = EdenQueryParams<any, TRoute>,
> = {
  options: Prettify<TreatyBaseOptions & TParams>
  queryKey: TreatyQueryKey<TPath>
}

/**
 * Calculates the query key.
 */
export type TreatyQueryKey<T extends Stringable[] = []> = Join<T, '/'>

/**
 */
export type TreatyData<TResponse extends Record<number, unknown>> = {
  data: TResponse[200]
  error: null
  response: Response
  status: number
  headers: RequestInit['headers']
}

/**
 */
export type TreatyError<TResponse extends Record<number, unknown>> = {
  data: null
  error: Exclude<keyof TResponse, 200> extends never
    ? {
        status: unknown
        value: unknown
      }
    : {
        [Status in keyof TResponse]: {
          status: Status
          value: TResponse[Status]
        }
      }[Exclude<keyof TResponse, 200>]
  response: Response
  status: number
  headers: RequestInit['headers']
}
