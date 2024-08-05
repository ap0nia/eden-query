import type { FetchQueryOptions } from '@tanstack/react-query'

import type { DistributiveOmit } from '../../utils/types'
import type { EdenUseQueryBaseOptions } from '../internal/query-base-options'

export type EdenFetchQueryOptions<TOutput, TError> = DistributiveOmit<
  FetchQueryOptions<TOutput, TError>,
  'queryKey'
> &
  EdenUseQueryBaseOptions
