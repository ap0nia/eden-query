import type { QueryClient } from '@tanstack/svelte-query'
import { createQueries } from '@tanstack/svelte-query'
import { getContext, setContext } from 'svelte'

import { EDEN_CONTEXT_KEY, SAMPLE_DOMAIN } from '../constants'
import type { EdenQueryConfig } from '../internal/config'
import type { AnyElysia } from '../types'
import { isBrowser } from '../utils/is-browser'
import { noop } from '../utils/noop'
import { createContext, type EdenTreatyQueryContext } from './context'
import { createEdenCreateQueriesProxy, type EdenCreateQueries } from './create-queries'
import { createEdenTreatyQueryProxyRoot, type EdenTreatyQueryRoot } from './root'
import { resolveDomain } from './utils'

export type EdenTreatyQuery<T extends AnyElysia> = EdenTreatyQueryRoot<T> & {
  /**
   */
  createQueries: EdenCreateQueries<T>

  /**
   * Save utilities in context for {@link EdenFetchQuery.getContext} to retrieve later.
   */
  setContext: (queryClient: QueryClient, configOverride?: EdenQueryConfig) => void

  /**
   * Get the utilities saved by {@link EdenFetchQuery.setContext}.
   */
  getContext: () => EdenTreatyQueryContext<T>

  /**
   * Create utilities.
   */
  createContext: <TConfig extends EdenQueryConfig = EdenQueryConfig>(
    domain?: string,
    config?: TConfig,
    elysia?: T,
  ) => EdenTreatyQueryContext<T, TConfig>
}

/**
 * Top-level proxy. Exposes top-level properties or initializes a new inner proxy based on
 * the first property access.
 */
export function createTreatyQueryProxy<T extends AnyElysia>(
  domain?: string,
  config: EdenQueryConfig = {},
  elysia?: T,
): any {
  const getContextThunk = () => {
    return getContext(EDEN_CONTEXT_KEY)
  }

  const setContextHelper = (queryClient: QueryClient, configOverride?: EdenQueryConfig) => {
    const resolvedConfig = { ...config, ...configOverride, queryClient }
    const contextProxy = createContext(domain, resolvedConfig, elysia)
    setContext(EDEN_CONTEXT_KEY, contextProxy)
  }

  const createQueriesProxy = createEdenCreateQueriesProxy<T>(domain, config, elysia)

  const edenCreateQueries: EdenCreateQueries<T['_routes']> = (callback) => {
    return createQueries(callback(createQueriesProxy) as any)
  }

  const topLevelProperties = {
    createContext: (newDomain?: string, newConfig?: EdenQueryConfig, newElysia?: T) => {
      const resolvedDomain = newDomain ?? domain
      const resolvedConfig = { ...newConfig, ...config }
      const resolvedElysia = newElysia ?? elysia
      return createContext(resolvedDomain, resolvedConfig, resolvedElysia)
    },
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

export function createEdenTreatyQuery<T extends AnyElysia>(
  /**
   * URL to server for client-side usage, {@link Elysia} instance for server-side usage,
   * or undefined for relative URLs.
   */
  domain?: string | T,
  config: EdenQueryConfig = {},
): EdenTreatyQuery<T> {
  if (domain == null) {
    return createTreatyQueryProxy(domain, config)
  }

  if (typeof domain === 'string') {
    const resolvedDomain = resolveDomain(domain, config)
    return createTreatyQueryProxy(resolvedDomain, config)
  }

  if (isBrowser()) {
    console.warn(
      'Elysia instance found on client side, this is not recommended for security reason. Use generic type instead.',
    )
  }

  return createTreatyQueryProxy(SAMPLE_DOMAIN, config, domain)
}

export * from './context'
export * from './create-queries'
export * from './root'
export * from './utils'
