import type {
  EmptyToVoid,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
} from '@ap0nia/eden'
import type {
  InfiniteData,
  UseSuspenseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryResult,
} from '@tanstack/react-query'
import type { RouteSchema } from 'elysia'

import type { DistributiveOmit } from '../../utils/types'
import type { ExtractCursorType } from '../internal/infinite-query'
import type { EdenQueryBaseOptions } from '../internal/query-base-options'
import type { WithEdenQueryExtension } from '../internal/query-hook-extension'

export interface EdenUseSuspenseInfiniteQueryOptions<TInput, TOutput, TError>
  extends DistributiveOmit<
      UseSuspenseInfiniteQueryOptions<
        TOutput,
        TError,
        TOutput,
        TOutput,
        any,
        ExtractCursorType<TInput>
      >,
      'queryKey' | 'initialPageParam'
    >,
    EdenQueryBaseOptions {
  initialCursor?: ExtractCursorType<TInput>
}

/**
 * @internal
 */
export type EdenUseSuspenseInfiniteQueryResult<TData, TError, TInput> = [
  InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>,
  WithEdenQueryExtension<
    UseSuspenseInfiniteQueryResult<
      InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>,
      TError
    >
  >,
]

export type EdenUseSuspenseInfiniteQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>['query'],
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = (
  input: EmptyToVoid<TInput>,
  options?: EdenUseSuspenseInfiniteQueryOptions<TOutput, TOutput, TError>,
) => EdenUseSuspenseInfiniteQueryResult<TOutput, TError, TInput>
