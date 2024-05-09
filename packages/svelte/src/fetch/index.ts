import { edenFetch } from '@elysiajs/eden'
import type { EdenFetch } from '@elysiajs/eden/fetch'
import {
  createInfiniteQuery,
  type CreateInfiniteQueryOptions,
  createMutation,
  type CreateMutationOptions,
  createQuery,
  type CreateQueryOptions,
  QueryClient,
  type StoreOrVal,
} from '@tanstack/svelte-query'
import { Elysia } from 'elysia'
import { getContext, setContext } from 'svelte'
import { get, writable } from 'svelte/store'

import type { HttpQueryMethod } from '../internal/http'
import type { InferRouteInput, InferRouteOutput } from '../internal/infer'
import type { EdenRequestOptions, SvelteQueryProxyConfig } from '../internal/options'
import { getQueryKey } from '../internal/query'
import type { TreatyToPath } from '../internal/treaty-to-path'
import type { Filter } from '../utils/filter'
import type { IsOptional } from '../utils/is-optional'
import { isStore } from '../utils/is-store'
import { createContext, EDEN_CONTEXT_KEY, type EdenFetchQueryContext } from './context'
import type { EdenFetchQueryHooks } from './hooks'

export type EdenFetchQueryConfig = EdenFetch.Config & SvelteQueryProxyConfig

/**
 * TODO: allow passing in an instance of {@link Elysia} for server-side usage.
 */
export function createEdenFetchQuery<
  T extends Elysia<any, any, any, any, any, any, any, any>,
  TConfig extends EdenFetchQueryConfig = EdenFetchQueryConfig,
>(
  server = '',
  config?: EdenFetchQueryConfig,
): T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? // @ts-expect-error Type 'unknown' is not assignable to type 'Record<string, any>'
    EdenFetchQuery<TreatyToPath<TSchema>, TConfig>
  : 'Please install Elysia before using Eden' {
  const fetch: any = edenFetch(server, config)

  const context = config?.queryClient != null ? createContext(fetch, config) : undefined

  const createContextThunk = () => createContext(fetch, config)

  const getContextThunk = () => {
    return getContext(EDEN_CONTEXT_KEY)
  }

  return {
    config: (newConfig: EdenFetchQueryConfig) => {
      return createEdenFetchQuery(server, { ...config, ...newConfig })
    },
    fetch,
    context,
    createContext: createContextThunk,
    setContext: (queryClient: QueryClient, configOverride?: EdenFetchQueryConfig) => {
      const contextProxy = createContext(fetch, { ...config, queryClient, ...configOverride })
      setContext(EDEN_CONTEXT_KEY, contextProxy)
    },
    getContext: getContextThunk,
    useUtils: getContextThunk,
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
      const optionsValue = isStore(options) ? get(options) : options

      const baseOptions = {
        mutationKey: [endpoint],
        mutationFn: async (variables) => {
          return await fetch(endpoint, variables)
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
            mutationFn: async (variables) => {
              return await fetch(endpoint, variables)
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
  } as any
}

export type EdenFetchQuery<
  TSchema extends Record<string, any>,
  TConfig extends EdenFetchQueryConfig = EdenFetchQueryConfig,
> = {
  /**
   * Official, initialized {@link edenFetch} instance.
   */
  fetch: EdenFetch.Fn<TSchema>

  /**
   * Get the utilities from setContext.
   */
  getContext: () => EdenFetchQueryContext<TSchema>

  /**
   * Alias for {@link EdenFetchQuery.createContext}
   */
  useUtils: () => EdenFetchQueryContext<TSchema>

  /**
   * Builder utility to strongly define the config in a second step.
   */
  config: <TNewConfig extends EdenFetchQueryConfig>(
    newConfig: TNewConfig,
  ) => EdenFetchQuery<TSchema, TNewConfig>
} & EdenFetchQueryHooks<TSchema> &
  (IsOptional<TConfig, 'queryClient'> extends true
    ? {
        context?: EdenFetchQueryContext<TSchema>
      }
    : {
        context: EdenFetchQueryContext<TSchema>
      })

export type InferEdenQueryInput<
  T extends Elysia<any, any, any, any, any, any, any, any>,
  TEndpoint extends keyof Filter<T['_routes'], HttpQueryMethod>,
  TMethod extends Uppercase<Extract<keyof T['_routes'][TEndpoint], HttpQueryMethod>>,
  TRoute extends
    T['_routes'][TEndpoint][Lowercase<TMethod>] = T['_routes'][TEndpoint][Lowercase<TMethod>],
> = InferRouteInput<TRoute>

export type InferEdenQueryOutput<
  T extends Elysia<any, any, any, any, any, any, any, any>,
  TEndpoint extends keyof Filter<T['_routes'], HttpQueryMethod>,
  TMethod extends Uppercase<Extract<keyof T['_routes'][TEndpoint], HttpQueryMethod>>,
  TRoute extends
    T['_routes'][TEndpoint][Lowercase<TMethod>] = T['_routes'][TEndpoint][Lowercase<TMethod>],
> = InferRouteOutput<TRoute>
