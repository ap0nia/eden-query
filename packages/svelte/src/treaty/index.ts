import type { Elysia } from 'elysia'

import { SAMPLE_DOMAIN } from '../constants'
import { httpMethods, resolveFetchOrigin } from '../internal/http'
import { resolveTreatyProxy } from './resolve'
import type { Treaty } from './types'

function isFetchCall(body: any, options: any, paths: string[]) {
  return (
    !body ||
    options ||
    (typeof body === 'object' && Object.keys(body).length !== 1) ||
    httpMethods.includes(paths.at(-1) as any)
  )
}

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

export function createTreatyFetchQuery<T extends Elysia<any, any, any, any, any, any, any, any>>(
  domain: string | T,
  config: Treaty.Config = {},
): Treaty.Create<T> {
  if (typeof domain === 'string') {
    const resolvedDomain = resolveFetchOrigin(domain, config)
    return createTreatyProxy(resolvedDomain, config)
  }

  if (typeof window !== 'undefined')
    console.warn(
      'Elysia instance server found on client side, this is not recommended for security reason. Use generic type instead.',
    )

  return createTreatyProxy(SAMPLE_DOMAIN, config, [], domain)
}
