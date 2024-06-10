import { LOCAL_ADDRESSES } from '../constants'

export const httpQueryMethods = ['get', 'options', 'head'] as const

export const httpMutationMethods = ['post', 'put', 'path', 'delete'] as const

export const httpSubscriptionMethods = ['connect', 'subscribe'] as const

export const httpMethods = [
  ...httpQueryMethods,
  ...httpMutationMethods,
  ...httpSubscriptionMethods,
] as const

export type HttpQueryMethod = (typeof httpQueryMethods)[number]

export type HttpMutationMethod = (typeof httpMutationMethods)[number]

export type HttpSubscriptionMethod = (typeof httpSubscriptionMethods)[number]

export type HttpMethod = (typeof httpMethods)[number]

export interface HeadersInitEsque {
  [Symbol.iterator](): IterableIterator<[string, string]>
}

export type HTTPHeaders = HeadersInitEsque | Record<string, string[] | string | undefined>

export function resolveWsOrigin(domain = '') {
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

export function isHttpMethod(value: any) {
  return httpMethods.includes(value)
}
