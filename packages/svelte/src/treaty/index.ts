import type { QueryClient } from '@tanstack/svelte-query'
import type { Elysia } from 'elysia'
import { getContext, setContext } from 'svelte'

import { EDEN_CONTEXT_KEY, SAMPLE_DOMAIN } from '../constants'
import { isFetchCall, resolveFetchOrigin } from '../internal/http'
import type { SvelteQueryProxyConfig } from '../internal/options'
import type { IsOptional } from '../utils/is-optional'
import { createContext, type EdenTreatyQueryContext } from './context'
import { resolveQueryTreatyProxy } from './resolve'
import type { EdenTreatyQueryHooks, TreatyConfig } from './types'

export type EdenTreatyQueryConfig = TreatyConfig & SvelteQueryProxyConfig

export type EdenTreatyQuery<
  TSchema extends Record<string, any>,
  TConfig extends EdenTreatyQueryConfig = EdenTreatyQueryConfig,
> = EdenTreatyQueryHooks<TSchema> &
  (IsOptional<TConfig, 'queryClient'> extends true
    ? {
        context?: EdenTreatyQueryContext<TSchema>
      }
    : {
        context: EdenTreatyQueryContext<TSchema>
      }) & {
    /**
     * Builder utility to strongly define the config in a second step.
     */
    config: <TNewConfig extends EdenTreatyQueryConfig>(
      newConfig: TNewConfig,
    ) => EdenTreatyQuery<TSchema, TNewConfig>
  }

/**
 * Proxy with svelte-query integration.
 *
 * Inner proxy builder.
 */
export function createTreatyQueryProxy(
  domain: string = '',
  config: EdenTreatyQueryConfig,
  paths: string[] = [],
  elysia?: Elysia<any, any, any, any, any, any>,
): any {
  /**
   */
  const configBuilder = (newConfig: EdenTreatyQueryConfig) => {
    return createTreatyFetchQuery(domain, { ...config, ...newConfig })
  }

  const f = fetch as any

  const context = config?.queryClient != null ? createContext(f, config) : undefined

  const getContextThunk = () => {
    return getContext(EDEN_CONTEXT_KEY)
  }

  const setContextHelper = (queryClient: QueryClient, configOverride?: EdenTreatyQueryConfig) => {
    const contextProxy = createContext(f, { ...config, queryClient, ...configOverride })
    setContext(EDEN_CONTEXT_KEY, contextProxy)
  }

  return new Proxy(() => {}, {
    get(_, path: string): any {
      switch (path) {
        case 'config': {
          return configBuilder
        }

        case 'context': {
          return context
        }

        case 'getContext': {
          return getContextThunk
        }

        case 'setContext': {
          return setContextHelper
        }

        default: {
          return createTreatyQueryProxy(
            domain,
            config,
            path === 'index' ? paths : [...paths, path],
            elysia,
          )
        }
      }
    },
    apply(_, __, [body, options]) {
      if (isFetchCall(body, options, paths)) {
        return resolveQueryTreatyProxy(body, options, domain, config, paths, elysia)
      }

      if (typeof body === 'object')
        return createTreatyQueryProxy(
          domain,
          config,
          [...paths, Object.values(body)[0] as string],
          elysia,
        )

      return createTreatyQueryProxy(domain, config, paths, elysia)
    },
  })
}

export function createTreatyFetchQuery<
  T extends Elysia<any, any, any, any, any, any, any, any>,
  TConfig extends EdenTreatyQueryConfig = EdenTreatyQueryConfig,
>(
  domain?: string | T,
  config: EdenTreatyQueryConfig = {},
): T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatyQuery<TSchema, TConfig>
  : 'Please install Elysia before using Eden' {
  if (domain == null) {
    return createTreatyQueryProxy(domain, config, [])
  }

  if (typeof domain === 'string') {
    const resolvedDomain = resolveFetchOrigin(domain, config)
    return createTreatyQueryProxy(resolvedDomain, config, [])
  }

  if (typeof window !== 'undefined')
    console.warn(
      'Elysia instance server found on client side, this is not recommended for security reason. Use generic type instead.',
    )

  return createTreatyQueryProxy(SAMPLE_DOMAIN, config, [], domain)
}
