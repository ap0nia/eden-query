import type { UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'

import type { DistributiveOmit } from '../../utils/types'
import type { EdenUseQueryBaseOptions } from '../internal/query-base-options'
import type { WithEdenQueryExtension } from '../internal/query-hook-extension'

export interface EdenUseSuspenseQueryOptions<TOutput, TData, TError>
  extends DistributiveOmit<UseSuspenseQueryOptions<TOutput, TError, TData, any>, 'queryKey'>,
    EdenUseQueryBaseOptions {}

/**
 * @internal
 */
export type EdenUseSuspenseQueryResult<TData, TError> = [
  TData,
  WithEdenQueryExtension<UseSuspenseQueryResult<TData, TError>>,
]
