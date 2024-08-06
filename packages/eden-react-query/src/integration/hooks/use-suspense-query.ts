import type { UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'

import type { DistributiveOmit } from '../../utils/types'
import type { EdenQueryBaseOptions } from '../internal/query-base-options'
import type { WithEdenQueryExtension } from '../internal/query-hook-extension'

export interface EdenUseSuspenseQueryOptions<TOutput, TData, TError>
  extends DistributiveOmit<UseSuspenseQueryOptions<TOutput, TError, TData, any>, 'queryKey'>,
    EdenQueryBaseOptions {}

/**
 * @internal
 */
export type EdenUseSuspenseQueryResult<TData, TError> = [
  TData,
  WithEdenQueryExtension<UseSuspenseQueryResult<TData, TError>>,
]
