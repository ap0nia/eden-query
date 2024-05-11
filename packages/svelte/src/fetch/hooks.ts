import type { EdenFetch } from '@elysiajs/eden/fetch'
import {
  type CreateBaseMutationResult,
  createInfiniteQuery,
  type CreateInfiniteQueryOptions,
  type CreateInfiniteQueryResult,
  createMutation,
  type CreateMutationOptions,
  createQuery,
  type CreateQueryOptions,
  type CreateQueryResult,
  type InfiniteData,
  type MutateOptions,
  type StoreOrVal,
} from '@tanstack/svelte-query'
import type { Elysia } from 'elysia'
import { get, type Readable, writable } from 'svelte/store'

import type { HttpMutationMethod, HttpQueryMethod } from '../internal/http'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import type { InfiniteRoutes, ReservedInfiniteQueryKeys } from '../internal/infinite'
import type { EdenQueryProxyConfig, EdenRequestOptions } from '../internal/options'
import { getQueryKey } from '../internal/query'
import type { TreatyToPath } from '../internal/treaty-to-path'
import type { Filter } from '../utils/filter'
import { isStore } from '../utils/is-store'
import type { Override } from '../utils/override'

export type EdenFetchQueryHooks<TSchema extends Record<string, any>> = {
  createQuery: <
    TEndpoint extends keyof Filter<TSchema, HttpQueryMethod>,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpQueryMethod>>,
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
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpQueryMethod>>,
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
    TEndpoint extends keyof Filter<TSchema, HttpMutationMethod>,
    TMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpMutationMethod>>,
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
  ) => Readable<
    // Override the default `mutate` and `mutateAsync` properties to properly resolve
    // duplicate endpoints with different methods.
    Override<
      CreateBaseMutationResult<TOutput, TError, TInput, TContext>,
      {
        mutateAsync: EdenFetchAsyncMutationFunction<TSchema, TEndpoint, TContext>
        mutate: EdenFetchMutationFunction<TSchema, TEndpoint, TContext>
      }
    >
  >
}

export type EdenFetchAsyncMutationFunction<
  TSchema extends Record<string, any>,
  TEndpoint extends keyof TSchema,
  TContext = any,
> = <
  TResolvedMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpMutationMethod>>,
  TResolvedRoute extends TSchema[TEndpoint][Lowercase<TResolvedMethod>],
  TResolvedOutput = InferRouteOutput<TResolvedRoute>,
  TResolvedError = InferRouteError<TResolvedRoute>,
>(
  variables: EdenRequestOptions<TResolvedMethod, TResolvedRoute>,
  options?: MutateOptions<
    TResolvedOutput,
    TResolvedError,
    EdenRequestOptions<TResolvedMethod, TResolvedRoute>,
    TContext
  >,
) => Promise<TResolvedOutput>

export type EdenFetchMutationFunction<
  TSchema extends Record<string, any>,
  TEndpoint extends keyof TSchema,
  TContext = any,
> = <
  TResolvedMethod extends Uppercase<Extract<keyof TSchema[TEndpoint], HttpMutationMethod>>,
  TResolvedRoute extends TSchema[TEndpoint][Lowercase<TResolvedMethod>],
  TResolvedOutput = InferRouteOutput<TResolvedRoute>,
  TResolvedError = InferRouteError<TResolvedRoute>,
>(
  variables: EdenRequestOptions<TResolvedMethod, TResolvedRoute>,
  options?: MutateOptions<
    TResolvedOutput,
    TResolvedError,
    EdenRequestOptions<TResolvedMethod, TResolvedRoute>,
    TContext
  >,
) => void

/**
 * Create the hooks.
 */
export function createHooks<T extends Elysia<any, any, any, any, any, any, any, any>>(
  fetch: EdenFetch.Fn<
    // @ts-expect-error Type 'unknown' is not assignable to type 'Record<string, any>'
    TreatyToPath<T['_routes']>
  >,
  config?: EdenQueryProxyConfig,
) {
  return {
    createQuery: (
      endpoint: string,
      options: StoreOrVal<EdenRequestOptions & { queryOptions?: Partial<CreateQueryOptions> }>,
    ) => {
      const optionsValue = isStore(options) ? get(options) : options

      const abortOnUnmount =
        Boolean(config?.abortOnUnmount) || Boolean(optionsValue.eden?.abortOnUnmount)

      const { queryOptions, ...rest } = optionsValue

      const baseQueryOptions = {
        queryKey: getQueryKey(endpoint, optionsValue, 'query'),
        queryFn: async (context) => {
          return await fetch(
            endpoint as any,
            {
              ...rest,
              signal: abortOnUnmount ? context.signal : undefined,
            } as EdenRequestOptions,
          )
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
              return await fetch(
                endpoint as any,
                {
                  ...rest,
                  signal: abortOnUnmount ? context.signal : undefined,
                } as EdenRequestOptions,
              )
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
        Boolean(config?.abortOnUnmount) || Boolean(optionsValue.eden?.abortOnUnmount)

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

          return await fetch(
            endpoint as any,
            {
              ...rest,
              signal: abortOnUnmount ? context.signal : undefined,
            } as EdenRequestOptions,
          )
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

              return await fetch(
                endpoint as any,
                {
                  ...rest,
                  signal: abortOnUnmount ? context.signal : undefined,
                } as EdenRequestOptions,
              )
            },
            ...queryOptions,
          })
        })

        return unsubscribe
      })

      return createInfiniteQuery(optionsStore)
    },
    createMutation: (endpoint: string, options?: CreateMutationOptions) => {
      const optionsValue = isStore(options) ? get(options) : options

      const baseOptions = {
        mutationKey: [endpoint],
        mutationFn: async (variables: any) => {
          return await fetch(endpoint as any, variables)
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

      if (!isStore(options)) {
        return createMutation(baseOptions)
      }

      const optionsStore = writable(baseOptions, (set) => {
        const unsubscribe = options.subscribe((newInput) => {
          set({
            ...baseOptions,
            mutationKey: [endpoint],
            mutationFn: async (variables: any) => {
              return await fetch(endpoint as any, variables)
            },
            onSuccess(data, variables, context) {
              const originalFn = () => newInput?.onSuccess?.(data, variables, context)

              return config?.overrides?.createMutation?.onSuccess != null
                ? config.overrides.createMutation.onSuccess({
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
  }
}
