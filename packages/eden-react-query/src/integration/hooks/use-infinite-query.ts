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
import type { EdenUseQueryBaseOptions } from '../internal/query-base-options'
import type { EdenQueryHookExtension } from '../internal/query-hook-extension'
import type { ExtractCursorType, ReservedInfiniteQueryKeys } from './infinite-query'

export interface EdenUseInfiniteQueryOptions<TInput, TOutput, TError>
  extends DistributiveOmit<
      UseInfiniteQueryOptions<TOutput, TError, TOutput, TOutput, any, ExtractCursorType<TInput>>,
      'queryKey' | 'initialPageParam'
    >,
    EdenUseQueryBaseOptions {
  initialCursor?: ExtractCursorType<TInput>
}

export type EdenUseInfiniteQueryResult<TData, TError, TInput> = EdenQueryHookExtension &
  UseInfiniteQueryResult<InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>, TError>

export type EdenUseInfiniteQuerySuccessResult<TData, TError, TInput> = EdenQueryHookExtension &
  InfiniteQueryObserverSuccessResult<
    InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>,
    TError
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
