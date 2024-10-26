import type { AnyElysia, MaybeArray, MaybePromise } from 'elysia'

import type { EdenFetchError } from './errors'
import type { HTTPHeaders } from './http'
import type { OperationContext } from './links/internal/operation'
import type { DataTransformerOptions } from './links/internal/transformer'
import type { Nullish } from './utils/null'

/**
 * Flexible format for defining headers.
 */
export type EdenRequestHeaders =
  | MaybeArray<
      | RequestInit['headers']
      | ((path: string, options?: RequestInit) => MaybePromise<RequestInit['headers'] | Nullish>)
    >
  | MaybePromise<HTTPHeaders>

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
 * General, untyped response.
 */
export type EdenResponse<TRaw extends boolean = false> = (
  | {
      data: null
      error: EdenFetchError<any, any>
      status: number
      statusText: string
    }
  | {
      data: any
      error: null
      status: number
      statusText: string
    }
) &
  (TRaw extends true ? EdenRawResponse : {})

/**
 * Raw response is __not__ JSON serializable, so only available when asked.
 */
export type EdenRawResponse = {
  headers: Headers
  response: Response
  statusText: string
}

/**
 * Options to customize the fetch behavior for the request.
 */
export type EdenRequestOptions<T extends AnyElysia = AnyElysia, TRaw extends boolean = false> = {
  /**
   */
  domain?: T | string

  /**
   */
  transformer?: DataTransformerOptions

  /**
   * Fetch options.
   */
  fetch?: Omit<RequestInit, keyof EdenRequestOptions | 'method'>

  /**
   * `fetch` implementation.
   */
  fetcher?: typeof fetch

  /**
   * Custom headers object that's processed and forwarded to the fetch options.
   */
  headers?: EdenRequestHeaders

  /**
   * Callback to invoke prior to fetching the request.
   */
  onRequest?: MaybeArray<EdenOnRequest>

  /**
   * Callback to invoke after fetching the request.
   */
  onResponse?: MaybeArray<EdenOnResponse>

  /**
   */
  keepDomain?: boolean

  /**
   */
  raw?: TRaw

  /**
   * Context to pass to the operation links.
   */
  context?: OperationContext
}
