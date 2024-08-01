import type {
  InferRouteBody,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
} from '@elysiajs/eden'
import type {
  MutateOptions,
  UseBaseMutationResult,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query'
import type { RouteSchema } from 'elysia'

import type { EdenHookResult } from './hook'
import type { EdenQueryRequestOptions } from './request'
import type { EdenUseQueryBaseOptions } from './use-query'
import type { Override } from './utils/types'

export interface EdenUseMutationOptions<TInput, TError, TOutput, TContext = unknown>
  extends UseMutationOptions<TOutput, TError, TInput, TContext>,
    EdenUseQueryBaseOptions {}

/**
 * @internal
 */
export type EdenUseMutationResult<TData, TError, TVariables, TContext> = EdenHookResult &
  UseMutationResult<TData, TError, TVariables, TContext>

export type EdenUseMutationVariables = {
  body: any
  options: EdenQueryRequestOptions
}

export type EdenUseMutation<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteBody<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = <TContext = unknown>(
  options?: EdenUseMutationOptions<TInput, TOutput, TError, TContext>,
) => Override<
  UseBaseMutationResult<TOutput, TError, TInput, TContext>,
  {
    mutateAsync: EdenAsyncMutationFunction<TRoute>
    mutate: EdenMutationFunction<TRoute>
  }
>

export type EdenAsyncMutationFunction<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
  TBody = InferRouteBody<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = <TContext = unknown>(
  variables: TBody,
  ...args: {} extends TInput
    ? [options?: TInput & MutateOptions<TOutput, TError, TBody, TContext>]
    : [options: TInput & MutateOptions<TOutput, TError, TBody, TContext>]
) => Promise<TOutput>

export type EdenMutationFunction<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
  TBody = InferRouteBody<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = <TContext = unknown>(
  variables: TBody,
  ...args: {} extends TInput
    ? [options?: TInput & MutateOptions<TOutput, TError, TBody, TContext>]
    : [options: TInput & MutateOptions<TOutput, TError, TBody, TContext>]
) => void
