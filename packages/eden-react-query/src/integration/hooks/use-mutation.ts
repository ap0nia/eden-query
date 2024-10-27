import type {
  EdenRequestParams,
  InferRouteBody,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
  ParsedPathAndMethod,
} from '@ap0nia/eden'
import {
  type DefaultError,
  type MutateOptions,
  type QueryClient,
  type UseBaseMutationResult,
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import type { RouteSchema } from 'elysia'

import type { EdenContextState } from '../../context'
import type { Override } from '../../utils/types'
import type { EdenQueryBaseOptions } from '../internal/query-base-options'
import type { WithEdenQueryExtension } from '../internal/query-hook-extension'
import { getMutationKey } from '../internal/query-key'

export type EdenUseMutationOptions<
  TInput,
  TError,
  TOutput,
  TContext = unknown,
> = UseMutationOptions<TOutput, TError, TInput, TContext> & EdenQueryBaseOptions

export type EdenUseMutationResult<TData, TError, TVariables, TContext, TInput> =
  WithEdenQueryExtension<
    Override<
      UseBaseMutationResult<TData, TError, TVariables, TContext>,
      {
        mutateAsync: EdenAsyncMutationFunction<TData, TError, TVariables, TInput>
        mutate: EdenMutationFunction<TData, TError, TVariables, TInput>
      }
    >
  >

export type EdenUseMutation<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TVariables = InferRouteBody<TRoute>,
  TInput = Partial<Pick<InferRouteOptions<TRoute>, 'params'>> &
    Omit<InferRouteOptions<TRoute>, 'params'>,
  TData = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = <TContext = unknown>(
  options?: EdenUseMutationOptions<TVariables, TError, TData, TContext>,
) => EdenUseMutationResult<TData, TError, TVariables, TContext, TInput>

export type EdenAsyncMutationFunction<TData, TError, TVariables, TInput> = <TContext = TData>(
  variables: {} extends TVariables ? void : unknown extends TVariables ? void : TVariables,
  options: {} extends TInput
    ?
        | void
        | (TInput &
            MutateOptions<TData, TError, EdenUseMutationVariables<TVariables, TInput>, TContext>)
    : TInput & MutateOptions<TData, TError, EdenUseMutationVariables<TVariables, TInput>, TContext>,
) => Promise<TData>

export type EdenMutationFunction<TData, TError, TVariables, TInput> = <TContext = unknown>(
  variables: {} extends TVariables ? void : unknown extends TVariables ? void : TVariables,
  options: {} extends TInput
    ?
        | void
        | (TInput &
            MutateOptions<TData, TError, EdenUseMutationVariables<TVariables, TInput>, TContext>)
    : TInput & MutateOptions<TData, TError, EdenUseMutationVariables<TVariables, TInput>, TContext>,
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

export function getEdenUseMutationOptions(
  parsedPathsAndMethod: ParsedPathAndMethod,
  context: EdenContextState<any, any>,
  // Default input.
  input?: InferRouteOptions,
  options?: EdenUseMutationOptions<any, any, any>,
  config?: any,
): UseMutationOptions {
  const { client, queryClient = useQueryClient() } = context

  const { paths, path, method } = parsedPathsAndMethod

  const mutationKey = getMutationKey(paths)

  const mutationDefaults = queryClient.getMutationDefaults(mutationKey)

  const defaultOptions = queryClient.defaultMutationOptions(mutationDefaults)

  const mutationOptions: UseMutationOptions = {
    ...options,
    mutationKey: mutationKey,
    mutationFn: async (variables: any = {}) => {
      const { body, options } = variables as EdenUseMutationVariables

      const resolvedOptions = { ...input, ...options }

      const params: EdenRequestParams = {
        ...config,
        options: resolvedOptions,
        body,
        path,
        method,
      }

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
  }

  return mutationOptions
}
