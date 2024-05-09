import type { Elysia } from 'elysia'

import { SAMPLE_DOMAIN } from '../constants'
import { httpMethods, resolveFetchOrigin } from '../internal/http'
import type { SvelteQueryProxyConfig } from '../internal/options'
import { resolveQueryTreatyProxy, resolveTreatyProxy } from './resolve'
import type { Treaty } from './types'

function isFetchCall(body: any, options: any, paths: string[]) {
  return (
    !body ||
    options ||
    (typeof body === 'object' && Object.keys(body).length !== 1) ||
    httpMethods.includes(paths.at(-1) as any)
  )
}

/**
 * Vanilla proxy, should be the same as the one offered by the official eden package.
 */
export function createTreatyProxy(
  domain: string,
  config: Treaty.Config,
  paths: string[] = [],
  elysia?: Elysia<any, any, any, any, any, any>,
): any {
  return new Proxy(() => {}, {
    get(_, path: string): any {
      return createTreatyProxy(domain, config, path === 'index' ? paths : [...paths, path], elysia)
    },
    apply(_, __, [body, options]) {
      if (isFetchCall(body, options, paths)) {
        return resolveTreatyProxy(body, options, domain, config, paths, elysia)
      }

      if (typeof body === 'object')
        return createTreatyProxy(
          domain,
          config,
          [...paths, Object.values(body)[0] as string],
          elysia,
        )

      return createTreatyProxy(domain, config, paths)
    },
  })
}

/**
 * Proxy with svelte-query integration.
 */
export function createTreatyQueryProxy(
  domain: string = '',
  config: Treaty.Config,
  paths: string[] = [],
  svelteQueryOptions?: SvelteQueryProxyConfig,
  elysia?: Elysia<any, any, any, any, any, any>,
): any {
  return new Proxy(() => {}, {
    get(_, path: string): any {
      return createTreatyQueryProxy(
        domain,
        config,
        path === 'index' ? paths : [...paths, path],
        svelteQueryOptions,
        elysia,
      )
    },
    apply(_, __, [body, options]) {
      if (isFetchCall(body, options, paths)) {
        return resolveQueryTreatyProxy(
          body,
          options,
          domain,
          config,
          paths,
          svelteQueryOptions,
          elysia,
        )
      }

      if (typeof body === 'object')
        return createTreatyQueryProxy(
          domain,
          config,
          [...paths, Object.values(body)[0] as string],
          svelteQueryOptions,
          elysia,
        )

      return createTreatyQueryProxy(domain, config, paths, svelteQueryOptions, elysia)
    },
  })
}

export function createTreatyFetchQuery<T extends Elysia<any, any, any, any, any, any, any, any>>(
  domain?: string | T,
  config: Treaty.Config = {},
  svelteQueryOptions?: SvelteQueryProxyConfig,
): Treaty.Create<T> {
  if (domain == null) {
    return createTreatyQueryProxy(domain, config, [], svelteQueryOptions)
  }

  if (typeof domain === 'string') {
    const resolvedDomain = resolveFetchOrigin(domain, config)
    return createTreatyQueryProxy(resolvedDomain, config, [], svelteQueryOptions)
  }

  if (typeof window !== 'undefined')
    console.warn(
      'Elysia instance server found on client side, this is not recommended for security reason. Use generic type instead.',
    )

  return createTreatyQueryProxy(SAMPLE_DOMAIN, config, [], svelteQueryOptions, domain)
}
