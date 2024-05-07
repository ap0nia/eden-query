import { LOCAL_ADDRESSES } from '../constants'
import type { Treaty } from '../treaty'

export const httpQueryMethods = ['get', 'options', 'head'] as const

export const httpMutationMethods = ['post', 'put', 'path', 'delete'] as const

export const httpSubscriptionMethods = ['connect', 'subscribe'] as const

export const httpMethods = [
  ...httpQueryMethods,
  ...httpMutationMethods,
  ...httpSubscriptionMethods,
] as const

export type HttpQueryMethods = (typeof httpQueryMethods)[number]

export type HttpMutationMethods = (typeof httpMutationMethods)[number]

export type HttpSubscriptionMethods = (typeof httpSubscriptionMethods)[number]

export type HttpMethods = (typeof httpMethods)[number]

export function resolveWsOrigin(domain: string) {
  return domain.replace(
    /^([^]+):\/\//,
    domain.startsWith('https://')
      ? 'wss://'
      : domain.startsWith('http://')
      ? 'ws://'
      : LOCAL_ADDRESSES.find((address) => domain.includes(address))
      ? 'ws://'
      : 'wss://',
  )
}

export function resolveFetchOrigin(domain: string, config: Treaty.Config) {
  if (!config.keepDomain) {
    if (!domain.includes('://')) {
      return (
        (LOCAL_ADDRESSES.find((address) => (domain as string).includes(address))
          ? 'http://'
          : 'https://') + domain
      )
    }

    if (domain.endsWith('/')) {
      return domain.slice(0, -1)
    }
  }

  return domain
}