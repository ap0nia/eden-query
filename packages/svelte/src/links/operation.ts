import type { RouteSchema } from 'elysia'

import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import type { Observable } from './observable'

/**
 * @internal
 */
export type OperationLink<
  TRoute extends RouteSchema,
  TInput = InferRouteInput<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = (options: OperationLinkOptions<TRoute, TInput, TOutput, TError>) => Observable<TOutput, TError>

export type OperationLinkOptions<
  TRoute extends RouteSchema,
  TInput = InferRouteInput<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = {
  operation: Operation<TRoute, TInput>
  next: (operation: Operation<TRoute, TInput>) => Observable<TOutput, TError>
}

/**
 * @internal
 */
export type Operation<TRoute extends RouteSchema, TInput = InferRouteInput<TRoute>> = {
  id: number
  path: string
  method: string
  input: TInput
}
