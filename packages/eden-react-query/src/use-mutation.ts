import type {
  InferRouteBody,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
} from '@elysiajs/eden'
import {
  type DefaultError,
  type MutateOptions,
  type QueryClient,
  type UseBaseMutationResult,
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query'
import type { RouteSchema } from 'elysia'

import type { EdenQueryHookExtension } from './hook'
import type { EdenQueryRequestOptions } from './request'
import type { EdenUseQueryBaseOptions } from './use-query'
import type { Override } from './utils/types'

export interface EdenUseMutationOptions<TInput, TError, TOutput, TContext = unknown>
  extends UseMutationOptions<TOutput, TError, TInput, TContext>,
    EdenUseQueryBaseOptions {}

/**
 * @internal
 */
export type EdenUseMutationResult<TData, TError, TVariables, TContext> = EdenQueryHookExtension &
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

/**
 * In order to extend the {@link createMutation} API to allow query/headers to be
 * passed in and forwarded properly, create custom wrapper around {@link createMutation} that
 * can accept multiple arguments.
 */
export function useEdenMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
  queryClient?: QueryClient,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const mutation = useMutation(options, queryClient)

  const customMutation = {
    ...mutation,
    mutate: (body: any, options = {}) => {
      const variables: EdenUseMutationVariables = { body, options }
      return mutation.mutate(variables as any, options)
    },
    mutateAsync: async (body: any, options = {}) => {
      const variables: EdenUseMutationVariables = { body, options }
      return await mutation.mutateAsync(variables as any, options)
    },
  }

  return customMutation
}
