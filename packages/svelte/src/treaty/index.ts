import type { QueryClient } from '@tanstack/svelte-query'
import { createQueries } from '@tanstack/svelte-query'
import type { Elysia } from 'elysia'
import { getContext, setContext } from 'svelte'

import { EDEN_CONTEXT_KEY, SAMPLE_DOMAIN } from '../constants'
import type { EdenQueryConfig } from '../internal/config'
import { isBrowser } from '../utils/is-browser'
import type { IsOptional } from '../utils/is-optional'
import { noop } from '../utils/noop'
import { createContext, type EdenTreatyQueryContext } from './context'
import { createEdenCreateQueriesProxy, type EdenCreateQueries } from './create-queries'
import { createEdenTreatyQueryProxyRoot, type EdenTreatyQueryRoot } from './root'
import { resolveFetchOrigin } from './utils'

export type EdenTreatyQuery<
  TSchema extends Record<string, any>,
  TConfig extends EdenQueryConfig = EdenQueryConfig,
> = EdenTreatyQueryRoot<TSchema> &
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
     */
    createQueries: EdenCreateQueries<TSchema>

    /**
     * Builder utility to strongly define the config in a second step.
     * Call this with a queryClient to assert that {@link EdenTreatyQuery.context} is defined.
     */
    config: <TNewConfig extends EdenQueryConfig>(
      newConfig: TNewConfig,
    ) => EdenTreatyQuery<TSchema, TNewConfig>

    /**
     * Save utilities in context for {@link EdenFetchQuery.getContext} to retrieve later.
     */
    setContext: (queryClient: QueryClient, configOverride?: EdenQueryConfig) => void

    /**
     * Get the utilities saved by {@link EdenFetchQuery.setContext}.
     */
    getContext: () => EdenTreatyQueryContext<TSchema>
  }

/**
 * Top-level proxy. Exposes top-level properties or initializes a new inner proxy based on
 * the first property access.
 */
export function createTreatyQueryProxy<
  T extends Elysia<any, any, any, any, any, any> = Elysia<any, any, any, any, any, any>,
>(domain?: string, config: EdenQueryConfig = {}, elysia?: T): any {
  /**
   */
  const configBuilder = (newConfig: EdenQueryConfig) => {
    return createEdenTreatyQuery(domain, { ...config, ...newConfig })
  }

  const context =
    config?.queryClient != null
      ? createContext(domain, config, config.queryClient, elysia)
      : undefined

  const getContextThunk = () => {
    return getContext(EDEN_CONTEXT_KEY)
  }

  const setContextHelper = (queryClient: QueryClient, configOverride?: EdenQueryConfig) => {
    const contextProxy = createContext(
      domain,
      { ...config, ...configOverride },
      queryClient,
      elysia,
    )
    setContext(EDEN_CONTEXT_KEY, contextProxy)
  }

  const createQueriesProxy = createEdenCreateQueriesProxy<T>(domain, config, elysia)

  const edenCreateQueries: EdenCreateQueries<T['_routes']> = (callback) => {
    return createQueries(callback(createQueriesProxy))
  }

  const topLevelProperties = {
    config: configBuilder,
    context,
    getContext: getContextThunk,
    setContext: setContextHelper,
    createQueries: edenCreateQueries,
  }

  const defaultHandler = (path: string | symbol) => {
    const innerProxy = createEdenTreatyQueryProxyRoot(domain, config, elysia)
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
  TConfig extends EdenQueryConfig = EdenQueryConfig,
>(
  /**
   * URL to server for client-side usage, {@link Elysia} instance for server-side usage,
   * or undefined for relative URLs.
   */
  domain?: string | T,
  config: EdenQueryConfig = {},
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

export type { InferTreatyQueryInput, InferTreatyQueryIO, InferTreatyQueryOutput } from './utils'
