import type { Elysia } from 'elysia'

import { SAMPLE_DOMAIN } from '../constants'
import { isFetchCall, resolveFetchOrigin } from '../internal/http'
import type { SvelteQueryProxyConfig } from '../internal/options'
import { resolveQueryTreatyProxy } from './resolve'
import type { Treaty } from './types'

export type EdenTreatyQueryConfig = Treaty.Config & SvelteQueryProxyConfig

/**
 * Proxy with svelte-query integration.
 */
export function createTreatyQueryProxy(
  domain: string = '',
  config: EdenTreatyQueryConfig,
  paths: string[] = [],
  elysia?: Elysia<any, any, any, any, any, any>,
): any {
  return new Proxy(() => {}, {
    get(_, path: string): any {
      return createTreatyQueryProxy(
        domain,
        config,
        path === 'index' ? paths : [...paths, path],
        elysia,
      )
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

export function createTreatyFetchQuery<T extends Elysia<any, any, any, any, any, any, any, any>>(
  domain?: string | T,
  config: EdenTreatyQueryConfig = {},
): Treaty.Create<T> {
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
