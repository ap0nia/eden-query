import type { QueryKey, UseSuspenseQueryOptions } from '@tanstack/react-query'

import type { DistributiveOmit } from '../../utils/types'
import type { EdenQueryBaseOptions } from './query-base-options'
import type { EdenQueryKey } from './query-key'

export type UseQueryOptionsForUseSuspenseQueries<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = DistributiveOmit<UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey'>

export type EdenUseQueryOptionsForUseSuspenseQueries<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptionsForUseSuspenseQueries<TQueryFnData, TError, TData, TQueryKey> &
  EdenQueryBaseOptions & {
    queryKey: EdenQueryKey
  }
