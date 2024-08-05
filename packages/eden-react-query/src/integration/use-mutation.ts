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

import type { EdenQueryHookExtension } from '../hook'
import type { Override } from '../utils/types'
import type { EdenUseQueryBaseOptions } from './query-base-options'

export type EdenUseMutationOptions<
  TInput,
  TError,
  TOutput,
  TContext = unknown,
> = UseMutationOptions<TOutput, TError, TInput, TContext> & EdenUseQueryBaseOptions

export type EdenUseMutationResult<TData, TError, TVariables, TContext, TInput> =
  EdenQueryHookExtension &
    Override<
      UseBaseMutationResult<TData, TError, TVariables, TContext>,
      {
        mutateAsync: EdenAsyncMutationFunction<TData, TError, TVariables, TInput>
        mutate: EdenMutationFunction<TData, TError, TVariables, TInput>
      }
    >

export type EdenUseMutation<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TVariables = InferRouteBody<TRoute>,
  TInput = InferRouteOptions<TRoute>,
  TData = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = <TContext = unknown>(
  options?: EdenUseMutationOptions<TVariables, TData, TError, TContext>,
) => EdenUseMutationResult<TData, TError, TVariables, TContext, TInput>

export type EdenAsyncMutationFunction<TData, TError, TVariables, TInput> = <TContext = unknown>(
  variables: TVariables,
  options: {} extends TInput
    ?
        | void
        | (TData &
            MutateOptions<TData, TError, EdenUseMutationVariables<TVariables, TInput>, TContext>)
    : TData & MutateOptions<TData, TError, EdenUseMutationVariables<TVariables, TInput>, TContext>,
) => Promise<TContext>

export type EdenMutationFunction<TData, TError, TVariables, TInput> = <TContext = unknown>(
  variables: TContext,
  options: {} extends TInput
    ?
        | void
        | (TData &
            MutateOptions<TData, TError, EdenUseMutationVariables<TVariables, TInput>, TContext>)
    : TData & MutateOptions<TData, TError, EdenUseMutationVariables<TVariables, TInput>, TContext>,
) => void

/**
 * @internal
 *
 * Need to be able to provide multiple arguments to `useMutation`, since
 * Eden's mutations accept a body as the first argument, and additional options
 * as the second argument -- which are sometimes required.
 *
 * To accomplish this, eden-query intercepts the hook call to grab the args as a single object,
 * then destructures it in custom `mutate` and `asyncMutate` implementations.
 *
 * This "hack" is needed since the vanilla `useMutation` hook doesn't allow multiple args :(
 */
export type EdenUseMutationVariables<TBody = any, TOptions = {}> = {
  /**
   * The first argument provided to the `useMutation` hook, i.e. the request body.
   */
  body: TBody
} & ({} extends TOptions
  ? {
      /**
       * The second argument provided to the `useMutation` hook, i.e. request options.
       */
      options?: TOptions
    }
  : {
      /**
       * The second argument provided to the `useMutation` hook, i.e. request options.
       */
      options: TOptions
    })

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

  /**
   * Custom eden-query-useMutation coalesces multiple args into one object for the vanilla
   * `useMutation` hook.
   */
  const edenMutation = {
    ...mutation,
    mutate: (body: any, options?: any) => {
      const variables: EdenUseMutationVariables = { body, options }
      return mutation.mutate(variables as TVariables, options)
    },
    mutateAsync: async (body: any, options?: any) => {
      const variables: EdenUseMutationVariables = { body, options }
      return await mutation.mutateAsync(variables as TVariables, options)
    },
  }

  return edenMutation
}
