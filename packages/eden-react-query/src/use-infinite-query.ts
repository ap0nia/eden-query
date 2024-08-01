import type { EdenRequestOptions } from '@elysiajs/eden'
import type {
  FetchInfiniteQueryOptions,
  InfiniteData,
  InfiniteQueryObserverSuccessResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'

import type { EdenHookResult } from './hook'
import type { EdenQueryKey } from './query-key'
import type { EdenUseQueryBaseOptions } from './use-query'
import type { DistributiveOmit } from './utils/types'

/**
 * Key in params or query that indicates GET routes that are eligible for infinite queries.
 */
export type InfiniteCursorKey = 'cursor'

/**
 * When providing request input to infinite queries, omit the "cursor" and "direction" properties
 * since these will be set by the integration.
 */
export type ReservedInfiniteQueryKeys = InfiniteCursorKey | 'direction'

/**
 * Given T, which is presumably a {@link RouteSchema}, merge the "params" and "query" types,
 * then extract the "cursor".
 */
export type ExtractCursorType<T> =
  T extends Record<string, any> ? (T['params'] & T['query'])['cursor'] : unknown

/**
 * @internal
 */
export type EdenUseInfiniteQueryResult<TData, TError, TInput> = EdenHookResult &
  UseInfiniteQueryResult<InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>, TError>

/**
 * @internal
 */
export type EdenUseInfiniteQuerySuccessResult<TData, TError, TInput> = EdenHookResult &
  InfiniteQueryObserverSuccessResult<
    InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>,
    TError
  >

export type EdenFetchInfiniteQueryOptions<TInput, TOutput, TError> = DistributiveOmit<
  FetchInfiniteQueryOptions<TOutput, TError, TOutput, EdenQueryKey, ExtractCursorType<TInput>>,
  'queryKey' | 'initialPageParam'
> &
  EdenRequestOptions & {
    initialCursor?: ExtractCursorType<TInput>
  }

export interface EdenUseInfiniteQueryOptions<TInput, TOutput, TError>
  extends DistributiveOmit<
      UseInfiniteQueryOptions<TOutput, TError, TOutput, TOutput, any, ExtractCursorType<TInput>>,
      'queryKey' | 'initialPageParam'
    >,
    EdenUseQueryBaseOptions {
  initialCursor?: ExtractCursorType<TInput>
}
