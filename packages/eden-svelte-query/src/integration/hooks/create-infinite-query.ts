import type { InferRouteError, InferRouteOptions, InferRouteOutput } from '@elysiajs/eden'
import type {
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  InfiniteData,
  InfiniteQueryObserverSuccessResult,
  SkipToken,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'

import type { DistributiveOmit } from '../../utils/types'
import type { ExtractCursorType, ReservedInfiniteQueryKeys } from '../internal/infinite-query'
import type { EdenQueryBaseOptions } from '../internal/query-base-options'
import type { WithEdenQueryExtension } from '../internal/query-hook-extension'

export interface EdenCreateInfiniteQueryOptions<TInput, TOutput, TError>
  extends DistributiveOmit<
      CreateInfiniteQueryOptions<TOutput, TError, TOutput, TOutput, any, ExtractCursorType<TInput>>,
      'queryKey' | 'initialPageParam'
    >,
    EdenQueryBaseOptions {
  initialCursor?: ExtractCursorType<TInput>
}

export type EdenCreateInfiniteQueryResult<TData, TError, TInput> = WithEdenQueryExtension<
  CreateInfiniteQueryResult<
    InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>,
    TError
  >
>

export type EdenCreateInfiniteQuerySuccessResult<TData, TError, TInput> = WithEdenQueryExtension<
  InfiniteQueryObserverSuccessResult<
    InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>,
    TError
  >
>

export type EdenCreateInfiniteQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute, ReservedInfiniteQueryKeys>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = (
  input: TInput | SkipToken,
  options: EdenCreateInfiniteQueryOptions<TInput, TOutput, TError>,
) => EdenCreateInfiniteQueryResult<TOutput, TError, TInput>
