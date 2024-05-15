/**
 * Utilities for the svelte-query integration.
 */

import {
  type CreateInfiniteQueryOptions,
  createMutation,
  type CreateMutationOptions,
  type CreateMutationResult,
  type CreateQueryOptions,
  type DefaultError,
  type MutationObserverOptions,
  type OmitKeyof,
  type QueryClient,
  type QueryKey,
  type StoreOrVal,
  type UndefinedInitialDataOptions,
} from '@tanstack/svelte-query'
import type { Elysia, RouteSchema } from 'elysia'
import { derived, get } from 'svelte/store'

import { isStore } from '../utils/is-store'
import type { EdenQueryConfig } from './config'
import { httpMethods, isHttpMethod } from './http'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from './infer'
import { resolveTreatyRequest } from './resolve'

export type GetRequestInput<T extends { params?: any; query?: any }> = T

export type InfiniteCursorKey = 'cursor'

export type ReservedInfiniteQueryKeys = InfiniteCursorKey | 'direction'

export type InfiniteInput<T extends RouteSchema> = InfiniteCursorKey extends keyof (T['params'] &
  T['query'])
  ? T
  : never

export type InfiniteRoutes<T> = {
  [K in keyof T as T[K] extends {
    get: GetRequestInput<InfiniteInput<infer _FetchOptions>>
  }
    ? K
    : never]: T[K]
}

export type EdenKnownQueryType = 'query' | 'infinite'

export type EdenQueryType = EdenKnownQueryType | 'any'

export type EdenQueryKey<
  TKey extends any[] = any[],
  TInput = unknown,
  TType extends EdenKnownQueryType = EdenKnownQueryType,
> = [key?: TKey, metadata?: { input?: TInput; type?: TType }]

export type EdenCreateQueryOptions<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput extends InferRouteInput<TRoute> = InferRouteInput<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TKey extends QueryKey = EdenQueryKey<TPath>,
> = TInput & {
  eden?: EdenQueryConfig
  queryOptions?: Omit<CreateQueryOptions<TOutput, TError, TOutput, TKey>, 'queryKey'>
}

export type EdenCreateInfiniteQueryOptions<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput extends InferRouteInput<TRoute> = InferRouteInput<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TKey extends QueryKey = EdenQueryKey<TPath>,
> = TInput & {
  eden?: EdenQueryConfig
  queryOptions: Omit<CreateInfiniteQueryOptions<TOutput, TError, TOutput, TKey>, 'queryKey'>
}

export type EdenCreateMutationOptions<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteInput<TRoute>['body'],
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  /**
   * TODO: what is TContext for a fetch request mutation?
   */
  TContext = unknown,
> = OmitKeyof<MutationObserverOptions<TOutput, TError, TInput, TContext>, '_defaulted'> & TInput

export function getQueryKey(
  pathOrEndpoint: string | string[],
  options?: InferRouteInput<any>,
  type?: EdenQueryType,
): EdenQueryKey {
  const path = Array.isArray(pathOrEndpoint) ? pathOrEndpoint : pathOrEndpoint.split('/')
  const hasInput = options?.body || options?.params || options?.query
  const hasType = Boolean(type) && type !== 'any'

  if (!hasInput && !hasType) return [path]

  const input = { body: options?.body, params: options?.params, query: options?.query }
  return [path, { ...(hasInput && { input }), ...(hasType && { type }) }]
}

export function getMutationKey(
  pathOrEndpoint: string | string[],
  options?: InferRouteInput<any>,
): EdenQueryKey {
  const path = Array.isArray(pathOrEndpoint) ? pathOrEndpoint : pathOrEndpoint.split('/')
  const hasInput = options?.body || options?.params || options?.query

  if (!hasInput) return [path]

  const input = { body: options?.body, params: options?.params, query: options?.query }
  return [path, { ...(hasInput && { input }) }]
}

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
    return {
      ...$mutation,
      mutate: (variables: any, options = {}) => {
        return $mutation.mutate({ variables, options } as any, options)
      },
      mutateAsync: async (variables: any, options = {}) => {
        return await $mutation.mutateAsync({ variables, options } as any, options)
      },
    }
  })

  return customMutation
}

export function createTreatyQueryOptions(
  paths: string[],
  args: any,
  domain?: string,
  config: EdenQueryConfig = {},
  elysia?: Elysia<any, any, any, any, any, any>,
): UndefinedInitialDataOptions {
  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  let method = paths[paths.length - 1]

  if (isHttpMethod(method)) {
    paths.pop()
  } else {
    method = 'get'
  }

  const typedOptions = args[0] as StoreOrVal<EdenCreateQueryOptions<any>>

  const optionsValue = isStore(typedOptions) ? get(typedOptions) : typedOptions

  const { queryOptions, eden, ...rest } = optionsValue

  const abortOnUnmount = Boolean(config?.abortOnUnmount) || Boolean(eden?.abortOnUnmount)

  /**
   * Resolve the config, and handle platform specific variables before resolving.
   */
  const resolvedConfig = {
    ...config,
    fetcher: config.event?.fetch ?? config.fetcher ?? globalThis.fetch,
  }

  const baseQueryOptions = {
    queryKey: getQueryKey(paths, optionsValue, 'query'),
    queryFn: async (context) => {
      const result = await resolveTreatyRequest(
        paths,
        method,
        {
          ...rest,
          fetch: {
            signal: abortOnUnmount ? context.signal : undefined,
          },
        },
        undefined,
        domain,
        resolvedConfig,
        elysia,
      )
      return result
    },
    ...queryOptions,
  } as UndefinedInitialDataOptions

  return baseQueryOptions
}

export function createTreatyInfiniteQueryOptions(
  paths: string[],
  args: any,
  domain?: string,
  config: EdenQueryConfig = {},
  elysia?: Elysia<any, any, any, any, any, any>,
): CreateInfiniteQueryOptions {
  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  let method = paths[paths.length - 1]

  if (isHttpMethod(method)) {
    paths.pop()
  } else {
    method = 'get'
  }

  const abortOnUnmount = Boolean(config?.abortOnUnmount) || Boolean(args[1]?.eden?.abortOnUnmount)

  const typedOptions = args[0] as StoreOrVal<EdenCreateInfiniteQueryOptions<any>>

  const optionsValue = isStore(typedOptions) ? get(typedOptions) : typedOptions

  const { queryOptions, ...rest } = optionsValue

  const additionalOptions = args[1]

  /**
   * Resolve the config, and handle platform specific variables before resolving.
   */
  const resolvedConfig = {
    ...config,
    fetcher: config.event?.fetch ?? config.fetcher ?? globalThis.fetch,
  }

  const infiniteQueryOptions = {
    queryKey: getQueryKey(paths, args[0], 'infinite'),
    queryFn: async (context) => {
      const options = { ...optionsValue }

      // FIXME: scuffed way to set cursor.
      if (options.query) {
        options.query['cursor'] = context.pageParam
      }

      if (options.params) {
        options.params['cursor'] = context.pageParam
      }

      const result = await resolveTreatyRequest(
        paths,
        method,
        {
          ...rest,
          fetch: {
            signal: abortOnUnmount ? context.signal : undefined,
          },
        },
        additionalOptions,
        domain,
        resolvedConfig,
        elysia,
      )

      return result
    },
    ...queryOptions,
  } as CreateInfiniteQueryOptions

  return infiniteQueryOptions
}

export function createTreatyMutationOptions(
  paths: string[],
  args: any,
  domain?: string,
  config: EdenQueryConfig = {},
  elysia?: Elysia<any, any, any, any, any, any>,
): CreateMutationOptions {
  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  let method = paths[paths.length - 1]

  if (isHttpMethod(method)) {
    paths.pop()
  } else {
    method = 'get'
  }

  const typedOptions = args[0] as CreateMutationOptions

  const optionsValue = isStore(typedOptions) ? get(typedOptions) : typedOptions

  const mutationOptions = {
    mutationKey: getMutationKey(paths, optionsValue as any),
    mutationFn: async (customVariables: any = {}) => {
      const { variables, options } = customVariables
      return await resolveTreatyRequest(paths, method, variables, options, domain, config, elysia)
    },
    onSuccess(data, variables, context) {
      const originalFn = () => optionsValue?.onSuccess?.(data, variables, context)
      return config?.overrides?.createMutation?.onSuccess != null
        ? config.overrides.createMutation.onSuccess({
            meta: optionsValue?.meta as any,
            originalFn,
          })
        : originalFn()
    },
    ...optionsValue,
  } satisfies CreateMutationOptions

  return mutationOptions
}

export function createTreatyQueryKey(paths: string[], anyArgs: any, type: EdenQueryType = 'any') {
  const pathsCopy: any[] = [...paths]

  /**
   * Pop the hook.
   * @example 'fetch', 'invalidate'
   */
  pathsCopy.pop() ?? ''

  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  const method = pathsCopy[pathsCopy.length - 1]

  if (httpMethods.includes(method)) {
    pathsCopy.pop()
  }

  const queryKey = getQueryKey(pathsCopy, anyArgs[0], type)

  return queryKey
}
