import { edenFetch } from '@elysiajs/eden'
import type { EdenFetch } from '@elysiajs/eden/fetch'
import {
  createInfiniteQuery,
  type CreateInfiniteQueryOptions,
  type CreateInfiniteQueryResult,
  createMutation,
  type CreateMutationOptions,
  type CreateMutationResult,
  createQuery,
  type CreateQueryOptions,
  type CreateQueryResult,
  type FetchInfiniteQueryOptions,
  type FetchQueryOptions,
  type InfiniteData,
  type InvalidateOptions,
  type StoreOrVal,
  useQueryClient,
} from '@tanstack/svelte-query'
import { Elysia } from 'elysia'
import { get, writable } from 'svelte/store'

import type { HttpMutationMethods, HttpQueryMethods } from '../internal/http'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import type { InfiniteRoutes, ReservedInfiniteQueryKeys } from '../internal/infinite'
import type { EdenRequestOptions, SvelteQueryProxyOptions } from '../internal/options'
import { getQueryKey } from '../internal/query'
import type { TreatyToPath } from '../internal/treaty-to-path'
import type { Filter } from '../utils/filter'
import { isStore } from '../utils/is-store'

function createContext<T extends Elysia<any, any, any, any, any, any, any, any>>(
  fetch: EdenFetch.Create<T>,
  svelteQueryOptions?: SvelteQueryProxyOptions,
) {
  const queryClient = svelteQueryOptions?.svelteQueryContext ?? useQueryClient()

  return {
    invalidate: (endpoint: string, input: any, options?: InvalidateOptions) => {
      queryClient.invalidateQueries(
        {
          queryKey: getQueryKey(endpoint, input),
        },
        options,
      )
    },
    fetch: (endpoint: string, input: any, options?: FetchQueryOptions) => {
      const abortOnUnmount = Boolean(svelteQueryOptions?.abortOnUnmount)

      const baseQueryOptions = {
        queryKey: getQueryKey(endpoint, input, 'query'),
        queryFn: async (context) => {
          return await fetch(
            endpoint as any,
            {
              ...input,
              signal: abortOnUnmount ? context.signal : undefined,
            } as EdenRequestOptions,
          )
        },
        ...options,
      } satisfies CreateQueryOptions

      return queryClient.fetchQuery(baseQueryOptions)
    },

    fetchInfinite: (endpoint: string, input: any, options?: FetchInfiniteQueryOptions) => {
      const abortOnUnmount = Boolean(svelteQueryOptions?.abortOnUnmount)

      const baseQueryOptions: FetchInfiniteQueryOptions = {
        initialPageParam: 0,
        queryKey: getQueryKey(endpoint, input, 'infinite'),
        queryFn: async (context) => {
          if (input.query) {
            input.query['cursor'] = context.pageParam
          }

          if (input.params) {
            input.params['cursor'] = context.pageParam
          }

          return await fetch(
            endpoint as any,
            {
              ...input,
              signal: abortOnUnmount ? context.signal : undefined,
            } as EdenRequestOptions,
          )
        },
        ...options,
      }

      return queryClient.fetchInfiniteQuery(baseQueryOptions)
    },
  }
}

export function createEdenFetchQuery<T extends Elysia<any, any, any, any, any, any, any, any>>(
  server: string,
  config?: EdenFetch.Config,
  svelteQueryOptions?: SvelteQueryProxyOptions,
): T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? // @ts-expect-error Type 'unknown' is not assignable to type 'Record<string, any>'
    EdenFetchQuery<TreatyToPath<TSchema>>
  : 'Please install Elysia before using Eden' {
  const fetch: any = edenFetch(server, config)

  const context =
    svelteQueryOptions?.svelteQueryContext != null
      ? createContext(fetch, svelteQueryOptions)
      : undefined

  return {
    fetch,
    context,
    createContext: () => createContext(fetch, svelteQueryOptions),
    createQuery: (
      endpoint: string,
      options: StoreOrVal<EdenRequestOptions & { queryOptions?: Partial<CreateQueryOptions> }>,
    ) => {
      const optionsValue = isStore(options) ? get(options) : options

      const abortOnUnmount =
        Boolean(svelteQueryOptions?.abortOnUnmount) || Boolean(optionsValue.eden?.abortOnUnmount)

      const { queryOptions, ...rest } = optionsValue

      const baseQueryOptions = {
        queryKey: getQueryKey(endpoint, optionsValue, 'query'),
        queryFn: async (context) => {
          return await fetch(endpoint, {
            ...rest,
            signal: abortOnUnmount ? context.signal : undefined,
          } as EdenRequestOptions)
        },
        ...queryOptions,
      } satisfies CreateQueryOptions

      if (!isStore(options)) {
        return createQuery(baseQueryOptions as any)
      }

      const optionsStore = writable(baseQueryOptions, (set) => {
        const unsubscribe = options.subscribe((newInput) => {
          const { queryOptions, ...rest } = optionsValue

          set({
            ...baseQueryOptions,
            queryKey: getQueryKey(endpoint, newInput, 'query'),
            queryFn: async (context) => {
              return await fetch(endpoint, {
                ...rest,
                signal: abortOnUnmount ? context.signal : undefined,
              } as EdenRequestOptions)
            },
            ...queryOptions,
          })
        })

        return unsubscribe
      })

      return createQuery(optionsStore as any)
    },
    createInfiniteQuery: (
      endpoint: string,
      options: StoreOrVal<
        EdenRequestOptions & { queryOptions?: Partial<CreateInfiniteQueryOptions> }
      >,
    ) => {
      const optionsValue = isStore(options) ? get(options) : options

      const abortOnUnmount =
        Boolean(svelteQueryOptions?.abortOnUnmount) || Boolean(optionsValue.eden?.abortOnUnmount)

      const { queryOptions, ...rest } = optionsValue

      const baseQueryOptions = {
        queryKey: getQueryKey(endpoint, optionsValue, 'infinite'),
        queryFn: async (context) => {
          // FIXME: scuffed way to set cursor.

          if (rest.query) {
            rest.query['cursor'] = context.pageParam
          }

          if (rest.params) {
            rest.params['cursor'] = context.pageParam
          }

          return await fetch(endpoint, {
            ...rest,
            signal: abortOnUnmount ? context.signal : undefined,
          } as EdenRequestOptions)
        },
        ...queryOptions,
      } as CreateInfiniteQueryOptions

      if (!isStore(options)) {
        return createInfiniteQuery(baseQueryOptions)
      }

      const optionsStore = writable(baseQueryOptions, (set) => {
        const unsubscribe = options.subscribe((newInput) => {
          const { queryOptions, ...rest } = newInput

          set({
            ...baseQueryOptions,
            queryKey: getQueryKey(endpoint, newInput, 'infinite'),
            queryFn: async (context) => {
              // FIXME: scuffed way to set cursor.

              if (rest.query) {
                rest.query['cursor'] = context.pageParam
              }

              if (rest.params) {
                rest.params['cursor'] = context.pageParam
              }
              return await fetch(endpoint, {
                ...rest,
                signal: abortOnUnmount ? context.signal : undefined,
              } as EdenRequestOptions)
            },
            ...queryOptions,
          })
        })

        return unsubscribe
      })

      return createInfiniteQuery(optionsStore)
    },
    createMutation: (endpoint: string, options?: CreateMutationOptions) => {
      const queryClient = svelteQueryOptions?.svelteQueryContext ?? useQueryClient()
      const optionsValue = isStore(options) ? get(options) : options

      const baseOptions = {
        mutationKey: [endpoint],
        mutationFn: async (variables) => {
          return await fetch(endpoint, variables)
        },
        onSuccess(data, variables, context) {
          const originalFn = () => optionsValue?.onSuccess?.(data, variables, context)

          return svelteQueryOptions?.overrides?.createMutation?.onSuccess != null
            ? svelteQueryOptions.overrides.createMutation.onSuccess({
                queryClient,
                meta: optionsValue?.meta as any,
                originalFn,
              })
            : originalFn()
        },
        ...optionsValue,
      } satisfies CreateMutationOptions

      if (!isStore(options)) {
        return createMutation(baseOptions)
      }

      const optionsStore = writable(baseOptions, (set) => {
        const unsubscribe = options.subscribe((newInput) => {
          set({
            ...baseOptions,
            mutationKey: [endpoint],
            mutationFn: async (variables) => {
              return await fetch(endpoint, variables)
            },
            onSuccess(data, variables, context) {
              const originalFn = () => newInput?.onSuccess?.(data, variables, context)

              return svelteQueryOptions?.overrides?.createMutation?.onSuccess != null
                ? svelteQueryOptions.overrides.createMutation.onSuccess({
                    queryClient,
                    meta: newInput?.meta as any,
                    originalFn,
                  })
                : originalFn()
            },
            ...newInput,
          })
        })

        return unsubscribe
      })

      return createMutation(optionsStore)
    },
  } as any
}

export type EdenFetchQueryContext<TSchema extends Record<string, any>> = {
  invalidate: <
    TEndpoint extends keyof Filter<TSchema, HttpQueryMethods>,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpQueryMethods>>,
    TRoute extends TSchema[TEndpoint][Lowercase<TMethod>],
  >(
    endpoint: TEndpoint,
    input: EdenRequestOptions<TMethod, TRoute>,
    options?: InvalidateOptions,
  ) => void

  fetch: <
    TEndpoint extends keyof Filter<TSchema, HttpQueryMethods>,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpQueryMethods>>,
    TRoute extends TSchema[TEndpoint][Lowercase<TMethod>],
    TOutput = InferRouteOutput<TRoute>,
  >(
    endpoint: TEndpoint,
    input: EdenRequestOptions<TMethod, TRoute>,
    options?: InvalidateOptions,
  ) => Promise<TOutput>

  fetchInfinite: <
    TEndpoint extends keyof InfiniteRoutes<TSchema>,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpQueryMethods>>,
    TRoute extends TSchema[TEndpoint][Lowercase<TMethod>],
    TOutput = InferRouteOutput<TRoute>,
    TError = InferRouteError<TRoute>,
  >(
    endpoint: TEndpoint,
    input: EdenRequestOptions<TMethod, TRoute>,
    options?: InvalidateOptions,
  ) => Promise<InfiniteData<TOutput, TError>>
}

export type EdenFetchQuery<TSchema extends Record<string, any>> = {
  fetch: EdenFetch.Fn<TSchema>

  context: EdenFetchQueryContext<TSchema>

  createContext: () => EdenFetchQueryContext<TSchema>

  createQuery: <
    TEndpoint extends keyof Filter<TSchema, HttpQueryMethods>,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpQueryMethods>>,
    TRoute extends TSchema[TEndpoint][Lowercase<TMethod>],
    TInput = InferRouteInput<TRoute>,
    TOutput = InferRouteOutput<TRoute>,
    TError = InferRouteError<TRoute>,
  >(
    endpoint: TEndpoint,
    options: StoreOrVal<
      EdenRequestOptions<TMethod, TRoute> & {
        queryOptions?: Omit<
          CreateQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>,
          'queryKey'
        >
      }
    >,
  ) => CreateQueryResult<TOutput, TError>

  createInfiniteQuery: <
    TEndpoint extends keyof InfiniteRoutes<TSchema>,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpQueryMethods>>,
    TRoute extends TSchema[TEndpoint][Lowercase<TMethod>],
    TInput = InferRouteInput<TRoute, ReservedInfiniteQueryKeys>,
    TOutput = InferRouteOutput<TRoute>,
    TError = InferRouteError<TRoute>,
  >(
    endpoint: TEndpoint,
    options: StoreOrVal<
      EdenRequestOptions<TMethod, TRoute, ReservedInfiniteQueryKeys> & {
        queryOptions: Omit<
          CreateInfiniteQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>,
          'queryKey'
        >
      }
    >,
  ) => CreateInfiniteQueryResult<InfiniteData<TOutput>, TError>

  createMutation: <
    TEndpoint extends keyof Filter<TSchema, HttpMutationMethods>,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpMutationMethods>>,
    TRoute extends TSchema[TEndpoint][Lowercase<TMethod>],
    TInput = EdenRequestOptions<TMethod, TRoute>,
    TOutput = InferRouteOutput<TRoute>,
    TError = InferRouteError<TRoute>,
    /**
     * TODO: what is TContext for a fetch request mutation?
     */
    TContext = unknown,
  >(
    endpoint: TEndpoint,
    options?: CreateMutationOptions<TOutput, TError, TInput, TContext>,
  ) => CreateMutationResult<TOutput, TError, TInput, TContext>
}
