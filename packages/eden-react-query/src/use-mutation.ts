import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

import type { EdenHookResult } from './hook'
import type { EdenUseQueryBaseOptions } from './use-query'

export interface EdenUseMutationOptions<TInput, TError, TOutput, TContext = unknown>
  extends UseMutationOptions<TOutput, TError, TInput, TContext>,
    EdenUseQueryBaseOptions {}

/**
 * @internal
 */
export type EdenUseMutationResult<TData, TError, TVariables, TContext> = EdenHookResult &
  UseMutationResult<TData, TError, TVariables, TContext>
