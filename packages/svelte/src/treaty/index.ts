import type { CreateMutationOptions, QueryClient } from '@tanstack/svelte-query'
import {
  createInfiniteQuery,
  type CreateInfiniteQueryOptions,
  type CreateInfiniteQueryResult,
  createQuery,
  type CreateQueryOptions,
  type CreateQueryResult,
  type InfiniteData,
  type StoreOrVal,
} from '@tanstack/svelte-query'
import type { Elysia } from 'elysia'
import type { Prettify, RouteSchema } from 'elysia/types'
import { getContext, setContext } from 'svelte'
import { writable } from 'svelte/store'

import { EDEN_CONTEXT_KEY, SAMPLE_DOMAIN } from '../constants'
import type { HttpMutationMethod, HttpQueryMethod, HttpSubscriptionMethod } from '../internal/http'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import type { InfiniteCursorKey, ReservedInfiniteQueryKeys } from '../internal/infinite'
import type { EdenQueryProxyConfig } from '../internal/options'
import type { EdenQueryParams } from '../internal/params'
import { isBrowser } from '../utils/is-browser'
import type { IsOptional } from '../utils/is-optional'
import { isStore } from '../utils/is-store'
import { noop } from '../utils/noop'
import { createContext, type EdenTreatyQueryContext } from './context'
import { createTreatyMutation, type EdenTreatyCreateMutation } from './mutation'
import type {
  EdenCreateInfiniteQueryOptions,
  EdenCreateQueryOptions,
  EdenTreatyQueryConfig,
  TreatyBaseOptions,
  TreatyQueryKey,
} from './types'
import {
  createTreatyInfiniteQueryOptions,
  createTreatyMutationOptions,
  createTreatyQueryOptions,
  resolveFetchOrigin,
} from './utils'

/**
 * GET hooks will only have one parameter: options.
 * eden.api.hello.get.createQuery(options)
 *
 * POST, etc. hooks will also only have one parameter: options.
 * They add body when calling `mutate` or `mutateAsync`
 *
 * const mutation = eden.api.hello.post.createMutation(options)
 * mutation.mutate(body)
 */
export function resolveQueryTreatyProxy(
  args: any[],
  domain?: string,
  config: EdenTreatyQueryConfig = {},
  paths: string[] = [],
  elysia?: Elysia<any, any, any, any, any, any>,
) {
  /**
   * @example 'createQuery'
   */
  const hook = paths.pop()

  switch (hook) {
    case 'createQuery': {
      const typedOptions = args[0] as StoreOrVal<EdenCreateQueryOptions>

      const queryOptions = createTreatyQueryOptions(paths, args, domain, config, elysia)

      if (!isStore(typedOptions)) {
        return createQuery(queryOptions as any)
      }

      const optionsStore = writable(queryOptions, (set) => {
        const unsubscribe = typedOptions.subscribe((newInput) => {
          args[0] = newInput
          const newQueryOptions = createTreatyQueryOptions(paths, args, domain, config, elysia)
          set({ ...queryOptions, ...newQueryOptions })
        })
        return unsubscribe
      })

      return createQuery(optionsStore as any)
    }

    case 'createInfiniteQuery': {
      const typedOptions = args[0] as StoreOrVal<EdenCreateInfiniteQueryOptions>

      const queryOptions = createTreatyInfiniteQueryOptions(paths, args, domain, config, elysia)

      if (!isStore(typedOptions)) {
        return createInfiniteQuery(queryOptions as any)
      }

      const optionsStore = writable(queryOptions, (set) => {
        const unsubscribe = typedOptions.subscribe((newInput) => {
          args[0] = newInput
          const newOptions = createTreatyInfiniteQueryOptions(paths, args, domain, config, elysia)
          set({ ...queryOptions, ...newOptions })
        })
        return unsubscribe
      })

      return createInfiniteQuery(optionsStore as any)
    }

    case 'createMutation': {
      const typedOptions = args[0] as CreateMutationOptions

      const mutationOptions = createTreatyMutationOptions(paths, args, domain, config, elysia)

      console.log({ mutationOptions })

      if (!isStore(typedOptions)) {
        return createTreatyMutation(mutationOptions)
      }

      const optionsStore = writable(mutationOptions, (set) => {
        const unsubscribe = typedOptions.subscribe((newInput) => {
          args[0] = newInput
          const newOptions = createTreatyMutationOptions(paths, args, domain, config, elysia)
          set({ ...mutationOptions, ...newOptions })
        })
        return unsubscribe
      })

      return createTreatyMutation(optionsStore as any)
    }

    // TODO: not sure how to handle subscriptions.
    // case 'createSubscription': {
    //   return client.subscription(path, anyArgs[0], anyArgs[1])
    // }

    default: {
      throw new TypeError(`eden.${paths.join('.')} is not a function`)
    }
  }
}
/**
 * Map {@link Elysia._routes} to svelte-query hooks.
 */
export type EdenTreatyQueryHooks<TSchema extends Record<string, any>, TPath extends any[] = []> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? TreatyQueryHooksMapping<TSchema[K], K, TPath>
    : EdenTreatyQueryHooks<TSchema[K], [...TPath, K]>
}

/**
 * Map a {@link RouteSchema} to an object with hooks.
 * @example { createQuery: ..., createInfiniteQuery: ... }
 */
export type TreatyQueryHooksMapping<
  TRoute extends RouteSchema,
  TMethod,
  TPath extends any[] = [],
> = TMethod extends HttpQueryMethod
  ? TreatyCreateQuery<TRoute, TPath>
  : TMethod extends HttpMutationMethod
  ? TreatyCreateMutation<TRoute, TPath>
  : TMethod extends HttpSubscriptionMethod
  ? TreatyCreateSubscription<TRoute, TPath>
  : never

/**
 * Hooks for a query procedure.
 */
export type TreatyCreateQuery<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TParams extends EdenQueryParams<any, TRoute> = EdenQueryParams<any, TRoute>,
  TInput = InferRouteInput<TRoute, ReservedInfiniteQueryKeys>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TEndpoint = TreatyQueryKey<TPath>,
> = {
  createQuery: (
    options: StoreOrVal<
      TParams & {
        eden?: EdenQueryProxyConfig
        queryOptions?: Omit<
          CreateQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>,
          'queryKey'
        >
      }
    >,
  ) => CreateQueryResult<TOutput, TError>
} & (InfiniteCursorKey extends keyof (TParams['params'] & TParams['query'])
  ? TreatyCreateInfiniteQuery<TRoute, TPath>
  : {})

/**
 * Hooks for an infinite-query procedure.
 */
export type TreatyCreateInfiniteQuery<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TParams extends EdenQueryParams<any, TRoute, ReservedInfiniteQueryKeys> = EdenQueryParams<
    any,
    TRoute
  >,
  TInput = InferRouteInput<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TEndpoint = TreatyQueryKey<TPath>,
> = {
  createInfiniteQuery: (
    options: StoreOrVal<
      TParams & {
        eden?: EdenQueryProxyConfig
        queryOptions: Omit<
          CreateInfiniteQueryOptions<TOutput, TError, TOutput, [TEndpoint, TInput]>,
          'queryKey'
        >
      }
    >,
  ) => CreateInfiniteQueryResult<InfiniteData<TOutput>, TError>
}

/**
 * Hooks for a mutation procedure.
 */
export type TreatyCreateMutation<TRoute extends RouteSchema, TPath extends any[] = []> = {
  createMutation: EdenTreatyCreateMutation<TRoute, TPath>
}

/**
 * TODO: Hooks for a subscription procedure.
 */
export type TreatyCreateSubscription<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TParams extends EdenQueryParams<any, TRoute> = EdenQueryParams<any, TRoute>,
> = {
  options: Prettify<TreatyBaseOptions & TParams>
  queryKey: TreatyQueryKey<TPath>
}

export type EdenTreatyQuery<
  TSchema extends Record<string, any>,
  TConfig extends EdenTreatyQueryConfig = EdenTreatyQueryConfig,
> = EdenTreatyQueryHooks<TSchema> &
  (IsOptional<TConfig, 'queryClient'> extends true
    ? {
        /**
         * Only guaranteed to be defined if {@link EdenTreatyQuery.config}
         * is invoked with a defined queryClient.
         */
        context?: EdenTreatyQueryContext<TSchema>
      }
    : {
        /**
         * Only guaranteed to be defined if {@link EdenTreatyQuery.config}
         * is invoked with a defined queryClient.
         */
        context: EdenTreatyQueryContext<TSchema>
      }) & {
    /**
     * Builder utility to strongly define the config in a second step.
     * Call this with a queryClient to assert that {@link EdenTreatyQuery.context} is defined.
     */
    config: <TNewConfig extends EdenTreatyQueryConfig>(
      newConfig: TNewConfig,
    ) => EdenTreatyQuery<TSchema, TNewConfig>

    /**
     * Save utilities in context for {@link EdenFetchQuery.getContext} to retrieve later.
     */
    setContext: (queryClient: QueryClient, configOverride?: EdenTreatyQueryConfig) => void

    /**
     * Get the utilities saved by {@link EdenFetchQuery.setContext}.
     */
    getContext: () => EdenTreatyQueryContext<TSchema>
  }

/**
 * Inner proxy. __Does not recursively create more proxies!__
 *
 * Once the first property has been decided from the top-level proxy,
 * future property accesses will mutate a locally scoped array.
 */
export function createInnerTreatyQueryProxy(
  domain?: string,
  config: EdenTreatyQueryConfig = {},
  elysia?: Elysia<any, any, any, any, any, any>,
): any {
  const paths: any[] = []

  const innerProxy: any = new Proxy(() => {}, {
    get: (_, path: string): any => {
      if (path !== 'index') {
        paths.push(path)
      }
      return innerProxy
    },
    apply: (_, __, args) => {
      return resolveQueryTreatyProxy(args, domain, config, [...paths], elysia)
    },
  })

  return innerProxy
}

/**
 * Top-level proxy. Exposes top-level properties or initializes a new inner proxy based on
 * the first property access.
 */
export function createTreatyQueryProxy(
  domain?: string,
  config: EdenTreatyQueryConfig = {},
  elysia?: Elysia<any, any, any, any, any, any>,
): any {
  /**
   */
  const configBuilder = (newConfig: EdenTreatyQueryConfig) => {
    return createEdenTreatyQuery(domain, { ...config, ...newConfig })
  }

  const context =
    config?.queryClient != null
      ? createContext(domain, config, config.queryClient, elysia)
      : undefined

  const getContextThunk = () => {
    return getContext(EDEN_CONTEXT_KEY)
  }

  const setContextHelper = (queryClient: QueryClient, configOverride?: EdenTreatyQueryConfig) => {
    const contextProxy = createContext(
      domain,
      { ...config, ...configOverride },
      queryClient,
      elysia,
    )
    setContext(EDEN_CONTEXT_KEY, contextProxy)
  }

  const topLevelProperties = {
    config: configBuilder,
    context,
    getContext: getContextThunk,
    setContext: setContextHelper,
  }

  const defaultHandler = (path: string | symbol) => {
    const innerProxy = createInnerTreatyQueryProxy(domain, config, elysia)
    return innerProxy[path]
  }

  const outerProxy = new Proxy(noop, {
    /**
     * @remarks Since {@link topLevelProperties.context} may be undefined, the default handler may be invoked instead of returning undefined.
     */
    get: (_, path) => {
      return topLevelProperties[path as keyof {}] ?? defaultHandler(path)
    },
  })

  return outerProxy
}

export function createEdenTreatyQuery<
  T extends Elysia<any, any, any, any, any, any, any, any>,
  TConfig extends EdenTreatyQueryConfig = EdenTreatyQueryConfig,
>(
  /**
   * URL to server for client-side usage, {@link Elysia} instance for server-side usage,
   * or undefined for relative URLs.
   */
  domain?: string | T,
  config: EdenTreatyQueryConfig = {},
): T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatyQuery<TSchema, TConfig>
  : 'Please install Elysia before using Eden' {
  if (domain == null) {
    return createTreatyQueryProxy(domain, config)
  }

  if (typeof domain === 'string') {
    const resolvedDomain = resolveFetchOrigin(domain, config)
    return createTreatyQueryProxy(resolvedDomain, config)
  }

  if (isBrowser()) {
    console.warn(
      'Elysia instance found on client side, this is not recommended for security reason. Use generic type instead.',
    )
  }

  return createTreatyQueryProxy(SAMPLE_DOMAIN, config, domain)
}
