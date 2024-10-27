import type {
  EmptyToVoid,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
} from '@ap0nia/eden'
import type { UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'
import type { RouteSchema } from 'elysia'

import type { DistributiveOmit } from '../../utils/types'
import type { EdenQueryBaseOptions } from '../internal/query-base-options'
import type { WithEdenQueryExtension } from '../internal/query-hook-extension'

export interface EdenUseSuspenseQueryOptions<TOutput, TData, TError>
  extends DistributiveOmit<UseSuspenseQueryOptions<TOutput, TError, TData, any>, 'queryKey'>,
    EdenQueryBaseOptions {}

/**
 * @internal
 */
export type EdenUseSuspenseQueryResult<TData, TError> = [
  TData,
  WithEdenQueryExtension<UseSuspenseQueryResult<TData, TError>>,
]

export type EdenUseSuspenseQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>['query'],
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = (
  input: EmptyToVoid<TInput>,
  options?: EdenUseSuspenseQueryOptions<TOutput, TOutput, TError>,
) => EdenUseSuspenseQueryResult<TOutput, TError>
