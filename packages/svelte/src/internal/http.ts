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

export function isFetchCall(body: any, options: any, paths: string[]) {
  return (
    !body ||
    options ||
    (typeof body === 'object' && Object.keys(body).length !== 1) ||
    httpMethods.includes(paths.at(-1) as any)
  )
}

export function isHttpMethod(value: any) {
  return httpMethods.includes(value)
}
