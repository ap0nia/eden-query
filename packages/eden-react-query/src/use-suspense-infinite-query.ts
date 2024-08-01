import type {
  InfiniteData,
  UseSuspenseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryResult,
} from '@tanstack/react-query'

import type { EdenHookResult } from './hook'
import type { ExtractCursorType } from './use-infinite-query'
import type { EdenUseQueryBaseOptions } from './use-query'
import type { DistributiveOmit } from './utils/types'

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
    EdenUseQueryBaseOptions {
  initialCursor?: ExtractCursorType<TInput>
}

/**
 * @internal
 */
export type EdenUseSuspenseInfiniteQueryResult<TData, TError, TInput> = [
  InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>,
  UseSuspenseInfiniteQueryResult<
    InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>,
    TError
  > &
    EdenHookResult,
]
