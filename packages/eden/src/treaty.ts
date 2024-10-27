import type { AnyElysia, RouteSchema } from 'elysia'

import { EdenClient } from './client'
import { type HttpMutationMethod, type HttpQueryMethod, type HttpSubscriptionMethod } from './http'
import type { InferRouteBody, InferRouteOptions, InferRouteResponse } from './infer'
import { parsePathsAndMethod } from './path'
import {
  type ExtractEdenTreatyRouteParams,
  type ExtractEdenTreatyRouteParamsInput,
  getPathParam,
} from './path-params'
import type { EdenRequestOptions } from './request'
import type { EdenRequestParams } from './resolve'
import type { EmptyToVoid } from './utils/empty-to-void'
import { isGetOrHeadMethod, isHttpMethod } from './utils/http'
import type { EdenWS } from './ws'

export interface EdenTreatyOptions<T extends AnyElysia> {
  client: EdenClient<T>
}

export type EdenTreatyClient<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatyHooksProxy<TSchema>
  : 'Please install Elysia before using Eden'

/**
 * TypeScript implementation for the proxy.
 *
 * Recursively iterate over all keys in the {@link RouteSchema}, processing path parameters
 * and regular path segments separately.
 */
// prettier-ignore
export type EdenTreatyHooksProxy<
  /**
   * The {@link RouteSchema} from the {@link AnyElysia} instance.
   */
  TSchema extends Record<string, any>,

  // The current path segments up to this point.
  TPath extends any[] = [],

  // Keys that are considered path parameters instead of regular path segments.
  TRouteParams = ExtractEdenTreatyRouteParams<TSchema>,
> =
  // Iterate over all regular path segments (excluding path paramters), and convert them
  // to leaves or recursively process them.
  {
    [K in Exclude<keyof TSchema, keyof TRouteParams>]:
    TSchema[K] extends RouteSchema

    // If the current value is a route, then the current key is the HTTP method,
    // e.g. "get", "post", etc. and the path segments up to this point is the actual route
    // (excluding path parameters).
    ? EdenTreatyQueryRouteLeaf<TSchema[K], K>

    // If the current value is not a route, then add the key to the path segments found,
    // then recursively process it.
    : EdenTreatyHooksProxy<TSchema[K], [...TPath, K]>
  }
  &
  // If there are no route parameters, then intersect with an empty object as a NOOP.
  // Otherwise, this part of the proxy can also be called like a function, which will
  // return the rest of the proxy (excluding the current path parameter).
  ({} extends TRouteParams
    ? {}
    : (
      params: ExtractEdenTreatyRouteParamsInput<TRouteParams>,
    ) => EdenTreatyHooksProxy<
      TSchema[Extract<keyof TRouteParams, keyof TSchema>],
      TPath
    >)

export type EdenTreatyQueryRouteLeaf<
  TRoute extends RouteSchema,
  TMethod,
> = TMethod extends HttpQueryMethod
  ? EdenTreatyQueryLeaf<TRoute>
  : TMethod extends HttpMutationMethod
    ? EdenTreatyMutationLeaf<TRoute>
    : TMethod extends HttpSubscriptionMethod
      ? EdenTreatySubscriptionLeaf<TRoute>
      : EdenTreatyUnknownLeaf<TRoute>

/**
 * Function that is called to make a query (i.e. "GET") request.
 */
export type EdenTreatyQueryLeaf<TRoute extends RouteSchema> = (
  options: EmptyToVoid<InferRouteOptions<TRoute>>,
) => InferRouteResponse<TRoute>

/**
 */
export type EdenTreatyMutationLeaf<TRoute extends RouteSchema> = (
  body: EmptyToVoid<InferRouteBody<TRoute>>,
  options: EmptyToVoid<InferRouteOptions>,
) => InferRouteResponse<TRoute>

/**
 * @TODO: Available hooks assuming that the route supports `createSubscription`.
 *
 * e.g. Routes that support "CONNECT" or "SUBSCRIBE" requests.
 */
export type EdenTreatySubscriptionLeaf<TRoute extends RouteSchema> = (
  options: EmptyToVoid<InferRouteOptions<TRoute>>,
) => EdenWS<TRoute>

/**
 * Available hooks for unrecognized HTTP methods.
 *
 * Will just show all possible hooks...
 */
export type EdenTreatyUnknownLeaf<TRoute extends RouteSchema> = EdenTreatyQueryLeaf<TRoute> &
  EdenTreatyQueryLeaf<TRoute> &
  EdenTreatyMutationLeaf<TRoute> &
  EdenTreatySubscriptionLeaf<TRoute>

export function createEdenTreaty<T extends AnyElysia>(
  client: EdenClient<T>,
  options?: EdenRequestOptions<T>,
): EdenTreatyClient<T> {
  const proxy = createEdenTreatyProxy(client, options)
  return proxy as any
}

export function createEdenTreatyProxy<T extends AnyElysia>(
  client: EdenClient<T>,
  config?: EdenRequestOptions<T>,

  /**
   * Path parameter strings including the current path parameter as a placeholder.
   *
   * @example [ 'products', ':id', ':cursor' ]
   */
  paths: string[] = [],

  /**
   * An array of objects representing path parameter replacements.
   * @example [ { id: 123 }, writable({ cursor: '456' }) ]
   */
  pathParams: Record<string, any>[] = [],
) {
  const edenTreatyProxy = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      // Copy the paths so that it can not be accidentally mutated.
      // Add the new path if it's not an "index" route.
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]

      //  Return a nested proxy that has been "pre-filled" with the new paths.
      return createEdenTreatyProxy(client, config, nextPaths, pathParams)
    },
    apply: (_target, _thisArg, args) => {
      const pathsCopy = [...paths]

      const httpMethod = pathsCopy.pop() ?? ''

      const pathParam = getPathParam(args)

      let options: any = undefined
      let body: any = undefined

      if (isGetOrHeadMethod(httpMethod)) {
        options = args[0]
      } else {
        body = args[0]
        options = args[1]
      }

      if (pathParam?.key != null && !isHttpMethod(httpMethod)) {
        const allPathParams = [...pathParams, pathParam.param]
        const pathsWithParams = [...paths, `:${pathParam.key}`]
        return createEdenTreatyProxy(client, config, pathsWithParams, allPathParams)
      }

      const { path, method } = parsePathsAndMethod(paths)

      const params: EdenRequestParams = {
        body,
        options,
        path,
        method,
        ...config,
      }

      return client.query(params)
    },
  })

  return edenTreatyProxy
}
