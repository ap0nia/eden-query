import type { FetchInfiniteQueryOptions } from '@tanstack/react-query'

import type { DistributiveOmit } from '../../utils/types'
import type { ExtractCursorType } from '../internal/infinite-query'
import type { EdenUseQueryBaseOptions } from '../internal/query-base-options'
import type { EdenQueryKey } from '../internal/query-key'

export type EdenFetchInfiniteQueryOptions<TInput, TOutput, TError> = DistributiveOmit<
  FetchInfiniteQueryOptions<TOutput, TError, TOutput, EdenQueryKey, ExtractCursorType<TInput>>,
  'queryKey' | 'initialPageParam'
> &
  EdenUseQueryBaseOptions & {
    initialCursor?: ExtractCursorType<TInput>
  }
