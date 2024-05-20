import type { MaybeArray, MaybePromise } from 'elysia/types'

import type { AnyElysia } from '../types'
import type { Nullish } from '../utils/null'
import type { EdenFetchError } from './error'

/**
 * Flexible format for defining headers.
 */
export type EdenRequestHeaders = MaybeArray<
  RequestInit['headers'] | ((path: string, options: RequestInit) => RequestInit['headers'] | void)
>

/**
 * Callback function to invoke before the request is made. The fetch options can be modified,
 * or new options can be returned.
 */
export type EdenOnRequest = (
  path: string,
  options: RequestInit,
) => MaybePromise<RequestInit | Nullish>

/**
 * Callback function to invoke after a response is received. Output value is ignored.
 */
export type EdenOnResponse = (response: Response) => MaybePromise<EdenResponse | Nullish>

/**
 * Options to customize the fetch behavior for the request.
 */
export type EdenRequestOptions<T extends AnyElysia = AnyElysia> = {
  /**
   */
  domain?: T | string

  /**
   */
  keepDomain?: boolean

  /**
   * Custom signal that's forwarded to the fetch request to enable aborting.
   */
  signal?: AbortSignal

  /**
   * Custom headers object that's processed and forwarded to the fetch options.
   */
  headers?: EdenRequestHeaders

  /**
   * Fetch options.
   */
  fetchInit?: Omit<RequestInit, keyof EdenRequestOptions | 'method'>

  /**
   * Fetch implementation.
   */
  fetch?: typeof fetch

  /**
   * Callback to invoke prior to fetching the request.
   */
  onRequest?: MaybeArray<EdenOnRequest>

  /**
   * Callback to invoke after fetching the request.
   */
  onResponse?: MaybeArray<EdenOnResponse>
}

export type EdenResponse = {
  data: any
  error: EdenFetchError<any, any> | null
  status: number
}
