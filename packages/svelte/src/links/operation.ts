import type { RouteSchema } from 'elysia'

import type { InferRouteError, InferRouteOutput } from '../internal/infer'
import type { EdenRequestParams } from '../internal/resolve'
import type { Observable } from './observable'

/**
 * @internal
 */
export type OperationLink<
  TRoute extends RouteSchema = any,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = (options: OperationLinkOptions<TRoute, TOutput, TError>) => Observable<TOutput, TError>

export type OperationLinkOptions<
  TRoute extends RouteSchema = any,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = {
  operation: EdenRequestParams
  next: (operation: EdenRequestParams) => Observable<TOutput, TError>
}
