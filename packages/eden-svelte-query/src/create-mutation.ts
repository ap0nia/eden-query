import type {
  EdenClient,
  EdenRequestParams,
  InferRouteBody,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
} from '@elysiajs/eden'
import { isHttpMethod } from '@elysiajs/eden/utils/http.ts'
import {
  type CreateBaseMutationResult,
  createMutation,
  type CreateMutationOptions,
  type CreateMutationResult,
  type DefaultError,
  type MutateOptions,
  type QueryClient,
  type StoreOrVal,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'
import { derived, type Readable } from 'svelte/store'

import type { EdenCreateQueryBaseOptions } from './create-query'
import type { EdenQueryKey, EdenQueryKeyOptions } from './query-key'
import type { EdenQueryRequestOptions } from './request'
import type { Override } from './utils/types'

export type EdenCreateMutationOptions<
  TInput,
  TError,
  TOutput,
  TContext = unknown,
> = CreateMutationOptions<TOutput, TError, TInput, TContext> & EdenCreateQueryBaseOptions

export function getMutationKey(
  pathOrEndpoint: string | string[],
  options?: EdenQueryKeyOptions,
): EdenQueryKey {
  const path = Array.isArray(pathOrEndpoint) ? pathOrEndpoint : pathOrEndpoint.split('/')
  const hasInput = options?.body != null || options?.params != null || options?.query != null

  if (!hasInput) return [path]

  const input = { body: options?.body, params: options?.params, query: options?.query }
  return [path, { ...(hasInput && { input }) }]
}

export type EdenCreateMutationVariables = {
  body: any
  options: EdenQueryRequestOptions
}

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

  const customMutation = derived(mutation, ($mutation) => {
    return {
      ...$mutation,
      mutate: (body: any, options = {}) => {
        const variables: EdenCreateMutationVariables = { body, options }
        return $mutation.mutate(variables as any, options)
      },
      mutateAsync: async (body: any, options = {}) => {
        const variables: EdenCreateMutationVariables = { body, options }
        return await $mutation.mutateAsync(variables as any, options)
      },
    }
  })

  return customMutation
}

export function createEdenMutationOptions(
  client: EdenClient,
  config?: EdenQueryRequestOptions,
  paths: string[] = [],
  args: any[] = [],
): CreateMutationOptions {
  /**
   * This may be the method, or part of a route.
   *
   * e.g. since invalidations can be partial and not include it.
   *
   * @example
   *
   * Let there be a GET endpoint at /api/hello/world
   *
   * GET request to /api/hello/world -> paths = ['api', 'hello', 'world', 'get']
   *
   * Invalidation request for all routes under /api/hello -> paths = ['api', 'hello']
   *
   * In the GET request, the last item is the method and can be safely popped.
   * In the invalidation, the last item is actually part of the path, so it needs to be preserved.
   */
  let method = paths[paths.length - 1]

  const methodIsHttpMethod = isHttpMethod(method)

  if (methodIsHttpMethod) {
    paths.pop()
  }

  const mutationOptions = args[0] as EdenCreateMutationOptions<any, any, any> | undefined

  const path = '/' + paths.join('/')

  const treatyMutationOptions: CreateMutationOptions = {
    mutationKey: getMutationKey(paths, mutationOptions as any),
    mutationFn: async (variables: any = {}) => {
      const { body, options } = variables as EdenCreateMutationVariables

      const resolvedParams: EdenRequestParams = {
        path,
        body,
        ...mutationOptions?.eden,
        ...options,
      }

      if (methodIsHttpMethod) {
        resolvedParams.method = method
      }

      const result = await client.query(resolvedParams)

      if (!('data' in result)) {
        return result
      }

      if (result.error != null) {
        throw result.error
      }

      return result.data
    },
    onSuccess: (data, variables, context) => {
      if (config?.overrides?.createMutation?.onSuccess == null) {
        return mutationOptions?.onSuccess?.(data, variables, context)
      }

      const meta: any = mutationOptions?.meta

      const originalFn = () => mutationOptions?.onSuccess?.(data, variables, context)

      return config.overrides.createMutation.onSuccess({ meta, originalFn })
    },
    ...mutationOptions,
  }

  return treatyMutationOptions
}

export type EdenCreateMutation<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteBody<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = <TContext = unknown>(
  options?: StoreOrVal<EdenCreateMutationOptions<TInput, TOutput, TError, TContext>>,
) => /**
 * TODO: move this to internal query file.
 */
Readable<
  Override<
    CreateBaseMutationResult<TOutput, TError, TInput, TContext>,
    {
      mutateAsync: EdenAsyncMutationFunction<TRoute>
      mutate: EdenMutationFunction<TRoute>
    }
  >
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
