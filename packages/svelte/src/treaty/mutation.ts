/**
 * Overrides for the default type definitions for svelte-query mutations to make them compatible
 * with the vanilla treaty interface.
 *
 * TODO: improve type performance.
 */

import {
  type CreateBaseMutationResult,
  createMutation,
  type CreateMutationOptions,
  type CreateMutationResult,
  type DefaultError,
  type MutateOptions,
  type MutationObserverOptions,
  type OmitKeyof,
  type QueryClient,
  type StoreOrVal,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'
import { derived, type Readable } from 'svelte/store'

import type { InferRouteError, InferRouteOutput } from '../internal/infer'
import type { EdenQueryParams } from '../internal/params'
import type { Override } from '../utils/override'

export type EdenTreatyCreateMutation<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = EdenQueryParams<any, TRoute>['body'],
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  /**
   * TODO: what is TContext for a fetch request mutation?
   */
  TContext = unknown,
> = (
  options?: StoreOrVal<
    OmitKeyof<MutationObserverOptions<TOutput, TError, TInput, TContext>, '_defaulted'> & TInput
  >,
) => Readable<
  Override<
    CreateBaseMutationResult<TOutput, TError, TInput, TContext>,
    {
      mutateAsync: EdenTreatyAsyncMutationFunction<TRoute>
      mutate: EdenTreatyMutationFunction<TRoute>
    }
  >
>

export type EdenTreatyAsyncMutationFunction<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput extends Record<string, any> = EdenQueryParams<any, TRoute>,
  TBody = TInput['body'],
  TParams = Omit<TInput, 'body'>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  /**
   * TODO: what is TContext for a fetch request mutation?
   */
  TContext = unknown,
> = (
  variables: TBody,
  ...args: {} extends TParams
    ? [options?: TParams & MutateOptions<TOutput, TError, TBody, TContext>]
    : [options: TParams & MutateOptions<TOutput, TError, TBody, TContext>]
) => Promise<TOutput>

export type EdenTreatyMutationFunction<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput extends Record<string, any> = EdenQueryParams<any, TRoute>,
  TBody = TInput['body'],
  TParams = Omit<TInput, 'body'>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  /**
   * TODO: what is TContext for a fetch request mutation?
   */
  TContext = unknown,
> = (
  variables: TBody,
  ...args: {} extends TParams
    ? [options?: TParams & MutateOptions<TOutput, TError, TBody, TContext>]
    : [options: TParams & MutateOptions<TOutput, TError, TBody, TContext>]
) => void

/**
 * In order to extend the {@link createMutation} API to allow query/headers to be
 * passed in and forwarded properly, create custom wrapper.
 */
export function createTreatyMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: CreateMutationOptions<TData, TError, TVariables, TContext>,
  queryClient?: QueryClient,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  const mutation = createMutation(options, queryClient)

  const customMutation = derived(mutation, ($mutation) => {
    const originalMutateAsync = $mutation.mutateAsync

    $mutation.mutateAsync = async (variables, options = {}) => {
      return await originalMutateAsync({ variables, options } as any, options)
    }

    const originalMutate = $mutation.mutate

    $mutation.mutate = (variables, options = {}) => {
      return originalMutate({ variables, options } as any, options)
    }

    return {
      ...$mutation,
    }
  })

  return customMutation
}
