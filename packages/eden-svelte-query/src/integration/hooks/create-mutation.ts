import type {
  EdenRequestParams,
  InferRouteBody,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
  ParsedPathAndMethod,
} from '@ap0nia/eden'
import {
  type CreateBaseMutationResult,
  createMutation,
  type CreateMutationOptions,
  type CreateMutationResult,
  type DefaultError,
  type MutateOptions,
  type QueryClient,
  type StoreOrVal,
  useQueryClient,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'
import { derived, type Readable } from 'svelte/store'

import type { EdenContextState } from '../../context'
import type { Override } from '../../utils/types'
import type { EdenQueryBaseOptions } from '../internal/query-base-options'
import type { WithEdenQueryExtension } from '../internal/query-hook-extension'
import { getMutationKey } from '../internal/query-key'

export type EdenCreateMutationOptions<
  TInput,
  TError,
  TOutput,
  TContext = unknown,
> = CreateMutationOptions<TOutput, TError, TInput, TContext> & EdenQueryBaseOptions

export type EdenCreateMutationResult<TData, TError, TVariables, TContext, TInput> =
  WithEdenQueryExtension<
    Readable<
      Override<
        CreateBaseMutationResult<TData, TError, TVariables, TContext>,
        {
          mutateAsync: EdenAsyncMutationFunction<TData, TError, TVariables, TInput>
          mutate: EdenMutationFunction<TData, TError, TVariables, TInput>
        }
      >
    >
  >

export type EdenCreateMutation<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TVariables = InferRouteBody<TRoute>,
  TInput = Partial<Pick<InferRouteOptions<TRoute>, 'params'>> &
    Omit<InferRouteOptions<TRoute>, 'params'>,
  TData = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = <TContext = unknown>(
  options?: EdenCreateMutationOptions<TVariables, TError, TData, TContext>,
) => EdenCreateMutationResult<TData, TError, TVariables, TContext, TInput>

export type EdenAsyncMutationFunction<TData, TError, TVariables, TInput> = <TContext = TData>(
  variables: TVariables,
  options: {} extends TInput
    ?
        | void
        | (TData &
            MutateOptions<TData, TError, EdenCreateMutationVariables<TVariables, TInput>, TContext>)
    : TData &
        MutateOptions<TData, TError, EdenCreateMutationVariables<TVariables, TInput>, TContext>,
) => Promise<TContext>

export type EdenMutationFunction<TData, TError, TVariables, TInput> = <TContext = unknown>(
  variables: TContext,
  options: {} extends TInput
    ?
        | void
        | (TData &
            MutateOptions<TData, TError, EdenCreateMutationVariables<TVariables, TInput>, TContext>)
    : TData &
        MutateOptions<TData, TError, EdenCreateMutationVariables<TVariables, TInput>, TContext>,
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
export type EdenCreateMutationVariables<TBody = any, TOptions = {}> = {
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
export function createEdenMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: StoreOrVal<CreateMutationOptions<TData, TError, TVariables, TContext>>,
  queryClient?: QueryClient,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  const mutation = createMutation(options, queryClient)

  /**
   * Custom eden-query-useMutation coalesces multiple args into one object for the vanilla
   * `useMutation` hook.
   */
  const edenMutation = derived(mutation, ($mutation) => {
    return {
      ...$mutation,
      mutate: (body: any, options?: any) => {
        const variables: EdenCreateMutationVariables = { body, options }
        return $mutation.mutate(variables as TVariables, options)
      },
      mutateAsync: async (body: any, options?: any) => {
        const variables: EdenCreateMutationVariables = { body, options }
        return await $mutation.mutateAsync(variables as TVariables, options)
      },
    }
  })

  return edenMutation
}

export function edenCreateMutationOptions(
  parsedPathsAndMethod: ParsedPathAndMethod,
  context: EdenContextState<any, any>,
  options: EdenCreateMutationOptions<any, any, any> = {},
  config?: any,
): CreateMutationOptions {
  const { client, queryClient = useQueryClient() } = context

  const { paths, path, method } = parsedPathsAndMethod

  const mutationKey = getMutationKey(paths)

  const mutationDefaults = queryClient.getMutationDefaults(mutationKey)

  const defaultOptions = queryClient.defaultMutationOptions(mutationDefaults)

  const { eden, ...mutationOptions } = options

  const resolvedMutationOptions: CreateMutationOptions = {
    mutationKey,
    mutationFn: async (variables: any = {}) => {
      const { body, options } = variables as EdenCreateMutationVariables

      const params = {
        ...config,
        options,
        body,
        path,
        method,
        ...eden,
      } satisfies EdenRequestParams

      const result = await client.query(params)

      if (!('data' in result)) {
        return result
      }

      if (result.error != null) {
        throw result.error
      }

      return result.data
    },
    onSuccess: (data, variables, context) => {
      const onSuccess = options?.onSuccess ?? defaultOptions.onSuccess

      if (config?.overrides?.useMutation?.onSuccess == null) {
        return onSuccess?.(data, variables, context)
      }

      const meta: any = options?.meta ?? defaultOptions.meta

      const originalFn = () => onSuccess?.(data, variables, context)

      return config.overrides.useMutation.onSuccess({ meta, originalFn, queryClient })
    },
    ...mutationOptions,
  }

  return resolvedMutationOptions
}
