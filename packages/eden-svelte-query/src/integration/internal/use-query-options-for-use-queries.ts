import type { CreateQueryOptions, QueryKey } from '@tanstack/svelte-query'

import type { DistributiveOmit } from '../../utils/types'
import type { EdenQueryBaseOptions } from './query-base-options'
import type { EdenQueryKey } from './query-key'

export type CreateQueryOptionsForUseQueries<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = DistributiveOmit<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey'>

export type EdenCreateQueryOptionsForUseQueries<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = CreateQueryOptionsForUseQueries<TQueryFnData, TError, TData, TQueryKey> &
  EdenQueryBaseOptions & {
    queryKey: EdenQueryKey
  }
