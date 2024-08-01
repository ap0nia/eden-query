import type {
  EdenClient,
  EdenRequestOptions,
  EdenRequestParams,
  InferRouteOptions,
} from '@elysiajs/eden'
import type {
  HttpMutationMethod,
  HttpQueryMethod,
  HttpSubscriptionMethod,
} from '@elysiajs/eden/http.ts'
import { isHttpMethod } from '@elysiajs/eden/utils/http.ts'
import {
  type UndefinedInitialDataOptions,
  useInfiniteQuery,
  type UseInfiniteQueryOptions,
  type UseMutationOptions,
  useQuery,
} from '@tanstack/react-query'
import type { AnyElysia, RouteSchema } from 'elysia'
import type { Prettify } from 'elysia/types'

import { type EdenQueryKey, getMutationKey, getQueryKey } from './query-key'
import type { EdenQueryRequestOptions } from './request'
import type {
  EdenUseInfiniteQuery,
  EdenUseInfiniteQueryOptions,
  InfiniteCursorKey,
} from './use-infinite-query'
import type { EdenUseMutation, EdenUseMutationOptions } from './use-mutation'
import type { EdenUseQuery, EdenUseQueryOptions } from './use-query'

export type EdenUseMutationVariables = {
  body: any
  options: EdenQueryRequestOptions
}

/**
 * The root proxy maps Elysia._routes to svelte-query hooks.
 */
export type EdenTreatyQueryHooks<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatyQueryHooksImplementation<TSchema>
  : 'Please install Elysia before using Eden'

/**
 * Implementation.
 */
export type EdenTreatyQueryHooksImplementation<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? EdenTreatyQueryRouteHooks<TSchema[K], K, TPath>
    : EdenTreatyQueryHooksImplementation<TSchema[K], [...TPath, K]>
}

/**
 * Maps a {@link RouteSchema} to an object with hooks.
 *
 * Defines available hooks for a specific route.
 *
 * @example { createQuery: ..., createInfiniteQuery: ... }
 */
export type EdenTreatyQueryRouteHooks<
  TRoute extends RouteSchema,
  TMethod,
  TPath extends any[] = [],
> = TMethod extends HttpQueryMethod
  ? EdenTreatyQueryMapping<TRoute, TPath>
  : TMethod extends HttpMutationMethod
    ? EdenTreatyMutationMapping<TRoute, TPath>
    : TMethod extends HttpSubscriptionMethod
      ? EdenTreatySubscriptionMapping<TRoute, TPath>
      : never

/**
 * Available hooks gassumingthat the route supports createQuery.
 */
export type EdenTreatyQueryMapping<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput extends InferRouteOptions<TRoute> = InferRouteOptions<TRoute>,
> = {
  useQuery: EdenUseQuery<TRoute, TPath>
} & (InfiniteCursorKey extends keyof (TInput['params'] & TInput['query'])
  ? EdenTreatyInfiniteQueryMapping<TRoute, TPath>
  : {})

/**
 * Available hooks assuming that the route supports createInfiniteQuery.
 */
export type EdenTreatyInfiniteQueryMapping<TRoute extends RouteSchema, TPath extends any[] = []> = {
  useInfiniteQuery: EdenUseInfiniteQuery<TRoute, TPath>
}

/**
 * Available hooks assuming that the route supports createMutation.
 */
export type EdenTreatyMutationMapping<TRoute extends RouteSchema, TPath extends any[] = []> = {
  useMutation: EdenUseMutation<TRoute, TPath>
}

/**
 * @TODO: Available hooks assuming that the route supports createSubscription.
 */
export type EdenTreatySubscriptionMapping<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
> = {
  options: Prettify<EdenRequestOptions & TInput>
  queryKey: EdenQueryKey<TPath>
}

/**
 * Inner proxy.
 */
export function createEdenTreatyQueryProxyRoot(
  client: EdenClient,
  options?: EdenQueryRequestOptions,
  paths: any[] = [],
): any {
  const innerProxy: any = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createEdenTreatyQueryProxyRoot(client, options, nextPaths)
    },
    apply: (_target, _thisArg, args) => {
      return resolveEdenTreatyQueryProxy(client, options, [...paths], args)
    },
  })

  return innerProxy
}

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
export function resolveEdenTreatyQueryProxy(
  client: EdenClient,
  config?: EdenQueryRequestOptions,
  originalPaths: string[] = [],
  args: any[] = [],
) {
  const paths = [...originalPaths]

  /**
   * @example 'createQuery'
   */
  const hook = paths.pop()

  switch (hook) {
    case 'useQuery': {
      const paths = [...originalPaths]

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

      if (isHttpMethod(method)) {
        paths.pop()
      }

      const { eden, ...queryOptions } = (args[1] ?? {}) as EdenUseQueryOptions<any, any, any>

      const params: EdenRequestParams = {
        ...config,
        ...eden,
        fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
      }

      const options = args[0] as InferRouteOptions

      const baseQueryOptions: UndefinedInitialDataOptions = {
        queryKey: getQueryKey(paths, options, 'query'),
        queryFn: async (context) => {
          const path = '/' + paths.join('/')

          const resolvedParams = { path, method, options, ...params }

          if (Boolean(config?.abortOnUnmount) || Boolean(eden?.abortOnUnmount)) {
            resolvedParams.fetch = { ...resolvedParams.fetch }
            resolvedParams.fetch.signal = context.signal
          }

          const result = await client.query(resolvedParams)

          if (result.error != null) {
            throw result.error
          }

          return result.data
        },
        ...queryOptions,
      }

      return useQuery(baseQueryOptions)
    }

    case 'useInfiniteQuery': {
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

      if (isHttpMethod(method)) {
        paths.pop()
      }

      const { eden, ...queryOptions } = (args[1] ?? {}) as EdenUseInfiniteQueryOptions<
        any,
        any,
        any
      >

      const params: EdenRequestParams = {
        ...config,
        ...eden,
        fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
      }

      const path = '/' + paths.join('/')

      const options = args[0] as InferRouteOptions

      const infiniteQueryOptions: UseInfiniteQueryOptions = {
        queryKey: getQueryKey(paths, options, 'infinite'),
        initialPageParam: 0,
        queryFn: async (context) => {
          const resolvedParams = { path, method, options: { ...options }, ...params }

          if (Boolean(config?.abortOnUnmount) || Boolean(eden?.abortOnUnmount)) {
            resolvedParams.fetch = { ...resolvedParams.fetch }
            resolvedParams.fetch.signal = context.signal
          }

          // FIXME: scuffed way to set cursor. Not sure how to tell if the cursor will be
          // in the route params or query.
          // e.g. /api/pages/:cursor -> /api/pages/1 or /api/pages?cursor=1

          if (resolvedParams.options.query) {
            ;(resolvedParams.options.query as any)['cursor'] = context.pageParam
          } else if (resolvedParams.options.params) {
            ;(resolvedParams.options.params as any)['cursor'] = context.pageParam
          }

          const result = await client.query(resolvedParams)

          if (result.error != null) {
            throw result.error
          }

          return result.data
        },
        ...queryOptions,
      }

      return useInfiniteQuery(infiniteQueryOptions)
    }

    case 'useMutation': {
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

      if (isHttpMethod(method)) {
        paths.pop()
      }

      const mutationOptions = args[0] as EdenUseMutationOptions<any, any, any> | undefined

      const path = '/' + paths.join('/')

      const treatyMutationOptions: UseMutationOptions = {
        mutationKey: getMutationKey(paths, mutationOptions as any),
        mutationFn: async (variables: any = {}) => {
          const { body, options } = variables as EdenUseMutationVariables

          const resolvedParams: EdenRequestParams = {
            path,
            method,
            body,
            ...mutationOptions?.eden,
            ...options,
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

    default: {
      throw new TypeError(`eden.${paths.join('.')} is not a function`)
    }
  }
}
