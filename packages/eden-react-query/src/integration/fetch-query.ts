import type { EdenRequestOptions } from '@elysiajs/eden'
import type { FetchQueryOptions } from '@tanstack/react-query'

import type { DistributiveOmit } from '../utils/types'

export type EdenFetchQueryOptions<TOutput, TError> = DistributiveOmit<
  FetchQueryOptions<TOutput, TError>,
  'queryKey'
> &
  EdenRequestOptions
