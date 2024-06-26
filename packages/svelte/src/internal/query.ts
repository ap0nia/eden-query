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
import { derived } from 'svelte/store'

import type { AnyElysia } from '../types'
import type { DistributiveOmit } from '../utils/distributive-omit'
import { EdenClient } from './client'
import { httpMethods, isHttpMethod } from './http'
import type { InferRouteInput } from './infer'
import type { EdenRequestOptions } from './request'

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
  options?: InferRouteInput,
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
  client: EdenClient,
  config?: EdenQueryRequestOptions,
  originalPaths: string[] = [],
  args: any[] = [],
): UndefinedInitialDataOptions {
  const paths = [...originalPaths]

  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  let method = paths[paths.length - 1]

  if (isHttpMethod(method)) {
    paths.pop()
  }

  /**
   * Main input will be provided as first argument.
   */
  const input = args[0] as InferRouteInput

  /**
   * Additional query options will be provided as the second argument to the `createQuery` call.
   */
  const { eden, ...queryOptions } = (args[1] ?? {}) as EdenCreateQueryOptions<any, any, any>

  const abortOnUnmount = Boolean(config?.abortOnUnmount) || Boolean(eden?.abortOnUnmount)

  /**
   * Resolve the config, and handle platform specific variables before resolving.
   */
  const requestOptions = {
    ...config,
    ...eden,
    fetch: eden?.fetch ?? config?.fetch ?? globalThis.fetch,
  }

  const endpoint = '/' + paths.join('/')

  const baseQueryOptions = {
    queryKey: getQueryKey(paths, input, 'query'),
    queryFn: async (context) => {
      const result = await client.query(
        {
          endpoint,
          method,
          input,
          ...requestOptions,
        },
        { signal: abortOnUnmount ? context.signal : undefined },
      )
      if (result.error != null) throw result.error
      return result.data
    },
    ...queryOptions,
  } as UndefinedInitialDataOptions

  return baseQueryOptions
}

export function createTreatyInfiniteQueryOptions(
  client: EdenClient,
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

  /**
   * Main input will be provided as first argument.
   */
  const input = args[0] as InferRouteInput

  /**
   * Additional query options will be provided as the second argument to the `createQuery` call.
   */
  const { eden, ...queryOptions } = (args[1] ?? {}) as EdenCreateInfiniteQueryOptions<any, any, any>

  const abortOnUnmount = Boolean(config?.abortOnUnmount) || Boolean(eden?.abortOnUnmount)

  /**
   * Resolve the config, and handle platform specific variables before resolving.
   */
  const requestOptions = {
    ...config,
    ...eden,
    fetch: eden?.fetch ?? config?.fetch ?? globalThis.fetch,
  }

  const endpoint = '/' + paths.join('/')

  const infiniteQueryOptions = {
    queryKey: getQueryKey(paths, input, 'infinite'),
    initialPageParam: 0,
    queryFn: async (context) => {
      const inputCopy: any = { ...input }

      // FIXME: scuffed way to set cursor.
      if (inputCopy.query) {
        inputCopy.query['cursor'] = context.pageParam
      }
      if (inputCopy.params) {
        inputCopy.params['cursor'] = context.pageParam
      }

      const result = await client.query(
        {
          endpoint,
          method,
          input,
          ...requestOptions,
        },
        { signal: abortOnUnmount ? context.signal : undefined },
      )
      if (result.error != null) throw result.error
      return result.data
    },
    ...queryOptions,
  } as CreateInfiniteQueryOptions

  return infiniteQueryOptions
}

export function createTreatyMutationOptions(
  client: EdenClient,
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

  const mutationOptions = args[0] as EdenCreateMutationOptions<any, any, any> | undefined

  const endpoint = '/' + paths.join('/')

  const treatyMutationOptions = {
    mutationKey: getMutationKey(paths, mutationOptions as any),
    mutationFn: async (customVariables: any = {}) => {
      /**
       * Custom wrapper around createMutation allows two arguments to be provided.
       * The first argument is input, and the second is per-request options.
       */
      const { variables, options } = customVariables

      const result = await client.query({
        endpoint,
        method,
        input: { body: variables, ...options },
        ...mutationOptions?.eden,
        ...options?.eden,
      })

      if (!('data' in result)) return result
      if (result.error != null) throw result.error
      return result.data
    },
    onSuccess(data, variables, context) {
      const originalFn = () => mutationOptions?.onSuccess?.(data, variables, context)
      return config?.overrides?.createMutation?.onSuccess != null
        ? config.overrides.createMutation.onSuccess({
            meta: mutationOptions?.meta as any,
            originalFn,
          })
        : originalFn()
    },
    ...mutationOptions,
  } satisfies CreateMutationOptions

  return treatyMutationOptions
}

export function createTreatyQueryKey(paths: string[], args: any, type: EdenQueryType = 'any') {
  const pathsCopy: any[] = [...paths]

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
