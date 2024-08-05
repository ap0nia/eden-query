import type { EdenRequestOptions } from '@elysiajs/eden'
import type { FetchInfiniteQueryOptions } from '@tanstack/react-query'

import type { DistributiveOmit } from '../utils/types'
import type { ExtractCursorType } from './infinite-query'
import type { EdenQueryKey } from './query-key'

export type EdenFetchInfiniteQueryOptions<TInput, TOutput, TError> = DistributiveOmit<
  FetchInfiniteQueryOptions<TOutput, TError, TOutput, EdenQueryKey, ExtractCursorType<TInput>>,
  'queryKey' | 'initialPageParam'
> &
  EdenRequestOptions & {
    initialCursor?: ExtractCursorType<TInput>
  }
