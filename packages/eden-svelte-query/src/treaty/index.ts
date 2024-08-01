import { EdenClient, type EdenLink, type EdenRequestOptions } from '@elysiajs/eden'
import { LOOPBACK_ADDRESSES } from '@elysiajs/eden/constants.ts'
import { httpLink } from '@elysiajs/eden/links/http-link.ts'
import { createQueries, QueryClient } from '@tanstack/svelte-query'
import type { AnyElysia } from 'elysia'
import { getContext, setContext } from 'svelte'

import { EDEN_CONTEXT_KEY } from '../constants'
import { createEdenCreateQueriesProxy, type EdenCreateQueries } from '../create-queries'
import type { EdenQueryRequestOptions } from '../request'
import { createContext, type EdenTreatyQueryContext } from './context'
import { createEdenTreatyQueryProxyRoot, type EdenTreatyQueryHooks } from './hooks'

type EdenTreatyGetContext<T extends AnyElysia> = () => EdenTreatyQueryContext<T>

type EdenTreatySetContext = (
  queryClient: QueryClient,
  configOverride?: EdenTreatyQueryConfig,
) => void

type EdenTreatyCreateContext<T extends AnyElysia> = (
  queryClient?: QueryClient,
  configOverride?: EdenTreatyQueryConfig,
) => EdenTreatyQueryContext<T>

export type EdenTreatyQueryConfig<T extends AnyElysia = AnyElysia> = EdenQueryRequestOptions<T> & {
  links?: EdenLink[]
}

/**
 * Properties at the root of the eden treaty svelte-query proxy.
 */
export type EdenTreatyBase<T extends AnyElysia> = {
  /**
   * Get utilities from context. Only use within Svelte components.
   */
  getContext: EdenTreatyGetContext<T>

  /**
   * Create utilities and set the context. Only use within Svelte components.
   */
  setContext: EdenTreatySetContext

  /**
   * Create utilities without setting the context. Can be used outside of Svelte components,
   * e.g. load functions.
   */
  createContext: EdenTreatyCreateContext<T>

  /**
   */
  createQueries: EdenCreateQueries<T>
}

export type EdenTreatyQuery<T extends AnyElysia> = EdenTreatyQueryHooks<T> & EdenTreatyBase<T>

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

  const setContextHelper = (
    queryClient = new QueryClient(),
    configOverride?: EdenTreatyQueryConfig,
  ) => {
    const resolvedConfig = { ...config, ...configOverride, queryClient }
    const contextProxy = createContext(client, resolvedConfig)
    setContext(EDEN_CONTEXT_KEY, contextProxy)
  }

  const createQueriesProxy = createEdenCreateQueriesProxy<T>(client, config)

  const edenCreateQueries: EdenCreateQueries<T> = (callback) => {
    return createQueries(callback(createQueriesProxy) as any)
  }

  const topLevelProperties = {
    createContext: (queryClient: QueryClient, newConfig?: EdenRequestOptions) => {
      const resolvedConfig = { ...config, ...newConfig, queryClient }
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

  const outerProxy = new Proxy(() => {}, {
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

export function resolveDomain(config?: EdenRequestOptions) {
  const domain = config?.domain

  if (typeof domain !== 'string') return domain

  if (config?.keepDomain) return domain

  if (!domain?.includes('://')) {
    const localAddressIndex = LOOPBACK_ADDRESSES.findIndex((address) => domain?.includes(address))
    const origin = localAddressIndex === -1 ? 'https://' : 'http://'
    return origin + domain
  }

  return domain.endsWith('/') ? domain.slice(0, -1) : domain
}

export * from './context'
export * from './hooks'
export * from './infer'
