import type { InferRouteError, InferRouteOptions, InferRouteOutput } from '@elysiajs/eden'
import type {
  InfiniteData,
  InfiniteQueryObserverSuccessResult,
  SkipToken,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'
import type { RouteSchema } from 'elysia'

import type { DistributiveOmit } from '../../utils/types'
import type { ExtractCursorType, ReservedInfiniteQueryKeys } from '../internal/infinite-query'
import type { EdenUseQueryBaseOptions } from '../internal/query-base-options'
import type { WithEdenQueryExtension } from '../internal/query-hook-extension'

export interface EdenUseInfiniteQueryOptions<TInput, TOutput, TError>
  extends DistributiveOmit<
      UseInfiniteQueryOptions<TOutput, TError, TOutput, TOutput, any, ExtractCursorType<TInput>>,
      'queryKey' | 'initialPageParam'
    >,
    EdenUseQueryBaseOptions {
  initialCursor?: ExtractCursorType<TInput>
}

export type EdenUseInfiniteQueryResult<TData, TError, TInput> = WithEdenQueryExtension<
  UseInfiniteQueryResult<InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>, TError>
>

export type EdenUseInfiniteQuerySuccessResult<TData, TError, TInput> = WithEdenQueryExtension<
  InfiniteQueryObserverSuccessResult<
    InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>,
    TError
  >
>

export type EdenUseInfiniteQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute, ReservedInfiniteQueryKeys>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = (
  input: TInput | SkipToken,
  options: EdenUseInfiniteQueryOptions<TInput, TOutput, TError>,
) => EdenUseInfiniteQueryResult<TOutput, TError, TInput>
