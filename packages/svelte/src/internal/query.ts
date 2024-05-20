import {
  type CreateBaseQueryOptions,
  type CreateInfiniteQueryOptions,
  type CreateInfiniteQueryResult,
  createMutation,
  type CreateMutationResult,
  type CreateQueryResult,
  type DefaultError,
  type DefinedCreateQueryResult,
  dehydrate,
  type DehydratedState,
  type InfiniteData,
  type InitialDataFunction,
  type MutationObserverOptions,
  type OmitKeyof,
  type QueryClient,
  type QueryOptions,
  type StoreOrVal,
  type UndefinedInitialDataOptions,
} from '@tanstack/svelte-query'
import type { MaybePromise, RouteSchema } from 'elysia'
import { derived, get } from 'svelte/store'

import type { AnyElysia } from '../types'
import type { DistributiveOmit } from '../utils/distributive-omit'
import { isStore } from '../utils/is-store'
import { EdenClient } from './client'
import { httpMethods, isHttpMethod } from './http'
import type { InferRouteInput } from './infer'
import type { EdenRequestOptions } from './request'
import { resolveEdenRequest } from './resolve'

/**
 * Options to customize the behavior of the query or fetch.
 */
export type EdenQueryRequestOptions<T extends AnyElysia = AnyElysia> =
  /**
   * Use svelte-query's internal AbortSignals instead of allowing user provided signals.
   */
  Omit<EdenRequestOptions<T>, 'signal'> & {
    /**
     * Opt out or into aborting request on unmount
     */
    abortOnUnmount?: boolean

    /**
     * Overrides for svelte-query hooks.
     */
    overrides?: EdenQueryOverrides

    /**
     * QueryClient to st
     */
    queryClient?: QueryClient

    /**
     * SSR option...
     */
    dehydrated?: boolean | DehydratedState
  }

export type EdenQueryOverrides = {
  createMutation?: Partial<CreateMutationOverride>
}

export type CreateMutationOverride = {
  onSuccess: (opts: {
    originalFn: () => StoreOrVal<unknown>
    meta: Record<string, unknown>
  }) => MaybePromise<unknown>
}

/**
 * Key in params or query that indicates GET routes that are eligible for infinite queries.
 */
export type InfiniteCursorKey = 'cursor'

/**
 * When providing request input to infinite queries, omit the "cursor" and "direction" properties
 * since these will be set by the integration.
 */
export type ReservedInfiniteQueryKeys = InfiniteCursorKey | 'direction'

/**
 * Merges the valid input for a GET request (i.e. params and query) into one object.
 */
export type MergedGetInput<T extends RouteSchema> = T['params'] & T['query']

/**
 * GET routes that are eligible for infinite queries must have a "cursor" property in
 * either the params or query.
 */
export type InfiniteInput<T extends RouteSchema> = InfiniteCursorKey extends keyof MergedGetInput<T>
  ? T
  : never

/**
 * Given T, which is presumably a {@link RouteSchema}, merge the "params" and "query" types,
 * then extract the "cursor".
 */
export type ExtractCursorType<T> = T extends Record<string, any>
  ? MergedGetInput<T>['cursor']
  : unknown

/**
 * Filters the routes of an Elysia instance for ones compatible with infinite queries.
 * i.e. GET routes that have {@link InfiniteCursorKey} in either the params or query.
 */
export type InfiniteRoutes<T> = {
  [K in keyof T as T[K] extends {
    get: InfiniteInput<infer _RouteSchema>
  }
    ? K
    : never]: T[K]
}

/**
 * A well-defined query type used when creating query keys for a specific type of operation.
 */
export type EdenKnownQueryType = 'query' | 'infinite'

/**
 * Valid query types for creating query keys.
 */
export type EdenQueryType = EdenKnownQueryType | 'any'

/**
 * QueryKey used internally. Consists of a tuple with an array key and metadata.
 */
export type EdenQueryKey<
  TKey extends any[] = string[],
  TInput = unknown,
  TType extends EdenKnownQueryType = EdenKnownQueryType,
> = [key: TKey, metadata?: { input?: TInput; type?: TType }]

/**
 * Additional options for queries.
 */
export type EdenCreateQueryBaseOptions = {
  /**
   * tRPC-related options
   */
  eden?: EdenQueryRequestOptions
}

export type EdenQueryOptions<TData, TError> = DistributiveOmit<
  QueryOptions<TData, TError, TData, any>,
  'queryKey'
> &
  EdenCreateQueryBaseOptions & {
    queryKey: EdenQueryKey
  }

/**
 * The CreateMutationOptions exported by svelte-query is pre-wrapped in StoreOrVal.
 * Extract the original type and wrap it manually later.
 */
export type CreateMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = OmitKeyof<MutationObserverOptions<TData, TError, TVariables, TContext>, '_defaulted'>

export type EdenCreateQueryOptions<
  TOutput,
  TData,
  TError,
  TQueryOptsData = TOutput,
> = DistributiveOmit<
  CreateBaseQueryOptions<TOutput, TError, TData, TQueryOptsData, any>,
  'queryKey'
> &
  EdenCreateQueryBaseOptions

export type EdenDefinedCreateQueryOptions<
  TOutput,
  TData,
  TError,
  TQueryOptsData = TOutput,
> = DistributiveOmit<
  CreateBaseQueryOptions<TOutput, TError, TData, TQueryOptsData, any>,
  'queryKey'
> &
  EdenCreateQueryBaseOptions & {
    initialData: InitialDataFunction<TQueryOptsData> | TQueryOptsData
  }

export type EdenCreateInfiniteQueryOptions<TInput, TOutput, TError> = DistributiveOmit<
  CreateInfiniteQueryOptions<TOutput, TError, TOutput, TOutput, any, ExtractCursorType<TInput>>,
  'queryKey' | 'initialPageParam'
> &
  EdenCreateQueryBaseOptions & {
    initialCursor?: ExtractCursorType<TInput>
  }

export type EdenCreateMutationOptions<
  TInput,
  TError,
  TOutput,
  TContext = unknown,
> = CreateMutationOptions<TOutput, TError, TInput, TContext> & EdenCreateQueryBaseOptions

export type EdenCreateSubscriptionOptions<TOutput, TError> = {
  enabled?: boolean
  onStarted?: () => void
  onData: (data: TOutput) => void
  onError?: (err: TError) => void
}

export type EdenHookResult = {
  eden: {
    path: string
  }
}

export type EdenCreateQueryResult<TData, TError> = CreateQueryResult<TData, TError> & EdenHookResult

export type EdenDefinedCreateQueryResult<TData, TError> = DefinedCreateQueryResult<TData, TError> &
  EdenHookResult

export type EdenCreateInfiniteQueryResult<TData, TError, TInput> = CreateInfiniteQueryResult<
  InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>,
  TError
> &
  EdenHookResult

export function getQueryKey(
  pathOrEndpoint: string | string[],
  options?: InferRouteInput<any>,
  type?: EdenQueryType,
): EdenQueryKey {
  const path = Array.isArray(pathOrEndpoint) ? pathOrEndpoint : pathOrEndpoint.split('/')
  const hasInput = options?.body != null || options?.params != null || options?.query != null
  const hasType = Boolean(type) && type !== 'any'

  if (!hasInput && !hasType) return [path]

  const input = { body: options?.body, params: options?.params, query: options?.query }
  return [path, { ...(hasInput && { input }), ...(hasType && { type }) }]
}

export type EdenCreateMutationResult<TData, TError, TVariables, TContext> = CreateMutationResult<
  TData,
  TError,
  TVariables,
  TContext
> &
  EdenHookResult

export function getMutationKey(
  pathOrEndpoint: string | string[],
  options?: InferRouteInput<any>,
): EdenQueryKey {
  const path = Array.isArray(pathOrEndpoint) ? pathOrEndpoint : pathOrEndpoint.split('/')
  const hasInput = options?.body != null || options?.params != null || options?.query != null

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
  options: StoreOrVal<CreateMutationOptions<TData, TError, TVariables, TContext>>,
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
  client?: EdenClient,
  config?: EdenQueryRequestOptions,
  paths: string[] = [],
  args: any[] = [],
): UndefinedInitialDataOptions {
  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  let method = paths[paths.length - 1]

  if (isHttpMethod(method)) {
    paths.pop()
  }

  const typedOptions = args[0] as StoreOrVal<EdenCreateQueryOptions<any, any, any>>

  const optionsValue = isStore(typedOptions) ? get(typedOptions) : typedOptions

  const { eden, ...bodyOrOptions } = optionsValue

  // const optionsOrUndefined = args[1]

  const abortOnUnmount = Boolean(config?.abortOnUnmount) || Boolean(eden?.abortOnUnmount)

  /**
   * Resolve the config, and handle platform specific variables before resolving.
   */
  // const resolvedConfig = {
  //   ...config,
  //   ...eden,
  //   fetcher: eden?.fetcher ?? config.event?.fetch ?? config.fetch ?? globalThis.fetch,
  // }

  const baseQueryOptions = {
    queryKey: getQueryKey(paths, optionsValue, 'query'),
    queryFn: async (context) => {
      const result = await client.query({
        method,
        input: bodyOrOptions,
        domain,
        signal: abortOnUnmount ? context.signal : undefined,
        elysia,
      })
      if (result.error != null) throw result.error
      return result.data
    },
    ...queryOptions,
  } as UndefinedInitialDataOptions

  return baseQueryOptions
}

export function createTreatyInfiniteQueryOptions(
  client?: EdenClient,
  config?: EdenQueryRequestOptions,
  paths: string[] = [],
  args: any[] = [],
): CreateInfiniteQueryOptions {
  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  let method = paths[paths.length - 1]

  if (isHttpMethod(method)) {
    paths.pop()
  }

  const typedOptions = args[0] as StoreOrVal<EdenCreateInfiniteQueryOptions<any>>

  const optionsValue = isStore(typedOptions) ? get(typedOptions) : typedOptions

  const { queryOptions, eden, ...rest } = optionsValue

  const abortOnUnmount = Boolean(config?.abortOnUnmount) || Boolean(eden?.abortOnUnmount)

  const optionsOrUndefined = args[1]

  /**
   * Resolve the config, and handle platform specific variables before resolving.
   */
  const resolvedConfig = {
    ...config,
    ...eden,
    fetcher: eden?.fetch ?? config.event?.fetch ?? config.fetch ?? globalThis.fetch,
  }

  const infiniteQueryOptions = {
    queryKey: getQueryKey(paths, args[0], 'infinite'),
    queryFn: async (context) => {
      const bodyOrOptions = { ...rest }

      // FIXME: scuffed way to set cursor.
      if (bodyOrOptions.query) {
        bodyOrOptions.query['cursor'] = context.pageParam
      }

      if (bodyOrOptions.params) {
        bodyOrOptions.params['cursor'] = context.pageParam
      }

      const result = await resolveEdenRequest({
        paths,
        method,
        input: bodyOrOptions,
        optionsOrUndefined,
        domain,
        request: resolvedConfig,
        signal: abortOnUnmount ? context.signal : undefined,
        elysia,
      })
      if (!('data' in result)) return result
      if (result.error != null) throw result.error
      return result.data
    },
    ...queryOptions,
  } as CreateInfiniteQueryOptions

  return infiniteQueryOptions
}

export function createTreatyMutationOptions(
  client?: EdenClient,
  config?: EdenQueryRequestOptions,
  paths: string[] = [],
  args: any[] = [],
): CreateMutationOptions {
  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  let method = paths[paths.length - 1]

  if (isHttpMethod(method)) {
    paths.pop()
  }

  const typedOptions = args[0] as CreateMutationOptions

  const optionsValue = isStore(typedOptions) ? get(typedOptions) : typedOptions

  const mutationOptions = {
    mutationKey: getMutationKey(paths, optionsValue as any),
    mutationFn: async (customVariables: any = {}) => {
      const result = await resolveEdenRequest({
        paths,
        method,
        input: customVariables.variables,
        optionsOrUndefined: customVariables.options,
        domain,
        request: config,
        elysia,
      })
      if (!('data' in result)) return result
      if (result.error != null) throw result.error
      return result.data
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

export function createTreatyQueryKey(paths: string[], args: any, type: EdenQueryType = 'any') {
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

  const queryKey = getQueryKey(pathsCopy, args[0], type)

  return queryKey
}

export function mergeDyhdrated(
  source: DehydratedState | QueryClient,
  destination: DehydratedState,
): DehydratedState {
  const dehydratedSource = 'mount' in source ? dehydrate(source) : source
  destination.queries.push(...dehydratedSource.queries)
  destination.mutations.push(...dehydratedSource.mutations)
  return destination
}
