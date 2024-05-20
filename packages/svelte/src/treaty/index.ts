import type { QueryClient } from '@tanstack/svelte-query'
import { createQueries } from '@tanstack/svelte-query'
import { getContext, setContext } from 'svelte'

import { EDEN_CONTEXT_KEY } from '../constants'
import { EdenClient } from '../internal/client'
import type { EdenQueryRequestOptions } from '../internal/query'
import type { EdenRequestOptions } from '../internal/request'
import { httpLink } from '../links/http-link'
import type { EdenLink } from '../links/internals/operation'
import type { AnyElysia } from '../types'
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
  setContext: (queryClient: QueryClient, configOverride?: EdenTreatyQueryConfig) => void

  /**
   * Get the utilities saved by {@link EdenFetchQuery.setContext}.
   */
  getContext: () => EdenTreatyQueryContext<T>

  /**
   * Create utilities.
   */
  createContext: (configOverride?: EdenTreatyQueryConfig) => EdenTreatyQueryContext<T>
}

export type EdenTreatyQueryConfig<T extends AnyElysia = AnyElysia> = EdenQueryRequestOptions<T> & {
  links?: EdenLink[]
}

/**
 * Top-level proxy. Exposes top-level properties or initializes a new inner proxy based on
 * the first property access.
 */
export function createTreatyQueryProxy<T extends AnyElysia>(
  client: EdenClient,
  config?: EdenTreatyQueryConfig<T>,
): any {
  const getContextThunk = () => {
    return getContext(EDEN_CONTEXT_KEY)
  }

  const setContextHelper = (queryClient: QueryClient, configOverride?: EdenTreatyQueryConfig) => {
    const resolvedConfig = { ...config, ...configOverride, queryClient }
    const contextProxy = createContext(client, resolvedConfig)
    setContext(EDEN_CONTEXT_KEY, contextProxy)
  }

  const createQueriesProxy = createEdenCreateQueriesProxy<T>(client, config)

  const edenCreateQueries: EdenCreateQueries<T['_routes']> = (callback) => {
    return createQueries(callback(createQueriesProxy) as any)
  }

  const topLevelProperties = {
    createContext: (newConfig?: EdenRequestOptions) => {
      const resolvedConfig = { ...newConfig, ...config }
      const resolvedDomain = resolveDomain(resolvedConfig)
      return createContext(client, { ...resolvedConfig, domain: resolvedDomain })
    },
    getContext: getContextThunk,
    setContext: setContextHelper,
    createQueries: edenCreateQueries,
  }

  const defaultHandler = (path: string | symbol) => {
    const innerProxy = createEdenTreatyQueryProxyRoot(client, config)
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
  config?: EdenTreatyQueryConfig<T>,
): EdenTreatyQuery<T> {
  const domain = resolveDomain(config)

  const links = config?.links ?? []

  if (links.length === 0) {
    const defaultHttpLink = httpLink(config)
    links.push(defaultHttpLink)
  }

  const client = new EdenClient({ links })

  return createTreatyQueryProxy(client, { ...config, domain })
}

export * from './context'
export * from './create-queries'
export * from './root'
export * from './utils'
