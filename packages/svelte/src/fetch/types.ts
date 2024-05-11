import type { Elysia } from 'elysia'

import type { HttpQueryMethod } from '../internal/http'
import type { InferRouteInput, InferRouteOutput } from '../internal/infer'
import type { Filter } from '../utils/filter'

export type InferEdenQueryInput<
  T extends Elysia<any, any, any, any, any, any, any, any>,
  TEndpoint extends keyof Filter<T['_routes'], HttpQueryMethod>,
  TMethod extends Uppercase<Extract<keyof T['_routes'][TEndpoint], HttpQueryMethod>>,
  TRoute extends
    T['_routes'][TEndpoint][Lowercase<TMethod>] = T['_routes'][TEndpoint][Lowercase<TMethod>],
> = InferRouteInput<TRoute>

export type InferEdenQueryOutput<
  T extends Elysia<any, any, any, any, any, any, any, any>,
  TEndpoint extends keyof Filter<T['_routes'], HttpQueryMethod>,
  TMethod extends Uppercase<Extract<keyof T['_routes'][TEndpoint], HttpQueryMethod>>,
  TRoute extends
    T['_routes'][TEndpoint][Lowercase<TMethod>] = T['_routes'][TEndpoint][Lowercase<TMethod>],
> = InferRouteOutput<TRoute>
