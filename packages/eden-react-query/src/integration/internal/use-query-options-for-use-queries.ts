import type { QueryKey, UseQueryOptions } from '@tanstack/react-query'

import type { DistributiveOmit } from '../../utils/types'
import type { EdenUseQueryBaseOptions } from './query-base-options'
import type { EdenQueryKey } from './query-key'

export type UseQueryOptionsForUseQueries<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = DistributiveOmit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey'>

export type EdenUseQueryOptionsForUseQueries<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptionsForUseQueries<TQueryFnData, TError, TData, TQueryKey> &
  EdenUseQueryBaseOptions & {
    queryKey: EdenQueryKey
  }
