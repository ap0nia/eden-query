import type { InfiniteData, InvalidateOptions } from '@tanstack/svelte-query'

import type { HttpQueryMethod } from '../internal/http'
import type { InferRouteError, InferRouteOutput } from '../internal/infer'
import type { InfiniteRoutes } from '../internal/infinite'
import type { EdenRequestOptions } from '../internal/options'
import type { Filter } from '../utils/filter'

export type EdenFetchQueryContext<TSchema extends Record<string, any>> = {
  invalidate: <
    TEndpoint extends keyof Filter<TSchema, HttpQueryMethod>,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpQueryMethod>>,
    TRoute extends TSchema[TEndpoint][Lowercase<TMethod>],
  >(
    endpoint: TEndpoint,
    input: EdenRequestOptions<TMethod, TRoute>,
    options?: InvalidateOptions,
  ) => void

  fetch: <
    TEndpoint extends keyof Filter<TSchema, HttpQueryMethod>,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpQueryMethod>>,
    TRoute extends TSchema[TEndpoint][Lowercase<TMethod>],
    TOutput = InferRouteOutput<TRoute>,
  >(
    endpoint: TEndpoint,
    input: EdenRequestOptions<TMethod, TRoute>,
    options?: InvalidateOptions,
  ) => Promise<TOutput>

  fetchInfinite: <
    TEndpoint extends keyof InfiniteRoutes<TSchema>,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpQueryMethod>>,
    TRoute extends TSchema[TEndpoint][Lowercase<TMethod>],
    TOutput = InferRouteOutput<TRoute>,
    TError = InferRouteError<TRoute>,
  >(
    endpoint: TEndpoint,
    input: EdenRequestOptions<TMethod, TRoute>,
    options?: InvalidateOptions,
  ) => Promise<InfiniteData<TOutput, TError>>
}
