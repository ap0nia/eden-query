import type { UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'

import type { EdenHookResult } from './hook'
import type { EdenUseQueryBaseOptions } from './use-query'
import type { DistributiveOmit } from './utils/types'

export interface EdenUseSuspenseQueryOptions<TOutput, TData, TError>
  extends DistributiveOmit<UseSuspenseQueryOptions<TOutput, TError, TData, any>, 'queryKey'>,
    EdenUseQueryBaseOptions {}

/**
 * @internal
 */
export type EdenUseSuspenseQueryResult<TData, TError> = [
  TData,
  UseSuspenseQueryResult<TData, TError> & EdenHookResult,
]
