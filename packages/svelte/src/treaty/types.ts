import type { MaybeArray, MaybePromise } from 'elysia/types'

import type { SvelteQueryProxyConfig } from '../internal/options'
import type { Join, Stringable } from '../utils/join'

export type EdenTreatyQueryConfig = TreatyConfig & SvelteQueryProxyConfig

/**
 * Additional options available for the `treaty` variant of eden.
 */
export interface TreatyBaseOptions {
  fetch?: RequestInit
}

/**
 */
export interface TreatyConfig {
  fetch?: Omit<RequestInit, 'headers' | 'method'>
  fetcher?: typeof fetch
  headers?: MaybeArray<
    RequestInit['headers'] | ((path: string, options: RequestInit) => RequestInit['headers'] | void)
  >
  onRequest?: MaybeArray<(path: string, options: RequestInit) => MaybePromise<RequestInit | void>>
  onResponse?: MaybeArray<(response: Response) => MaybePromise<unknown>>
  keepDomain?: boolean
}

/**
 * Calculates the query key.
 */
export type TreatyQueryKey<T extends Stringable[] = []> = Join<T, '/'>

/**
 */
export type TreatyData<TResponse extends Record<number, unknown>> = {
  data: TResponse[200]
  error: null
  response: Response
  status: number
  headers: RequestInit['headers']
}

/**
 */
export type TreatyError<TResponse extends Record<number, unknown>> = {
  data: null
  error: Exclude<keyof TResponse, 200> extends never
    ? {
        status: unknown
        value: unknown
      }
    : {
        [Status in keyof TResponse]: {
          status: Status
          value: TResponse[Status]
        }
      }[Exclude<keyof TResponse, 200>]
  response: Response
  status: number
  headers: RequestInit['headers']
}
