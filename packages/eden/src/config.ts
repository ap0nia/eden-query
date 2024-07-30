import type { MaybeArray, MaybePromise } from 'elysia/types'

/**
 * Configuration for Eden client. It can also be specified on a request to override the client's defaults.
 */
export interface EdenTreatyConfig {
  /**
   * Serializer and de-serializer for the input and output respectively.
   */
  transformer?: DataTransformerOptions

  /**
   * Initialization options passed to the `fetch` call.
   */
  fetch?: Omit<RequestInit, 'headers' | 'method'>

  /**
   * `fetch` implementation.
   */
  fetcher?: typeof fetch

  /**
   * Custom headers.
   */
  headers?: MaybeArray<
    RequestInit['headers'] | ((path: string, options: RequestInit) => RequestInit['headers'] | void)
  >

  /**
   * Callbacks to override or transform the fetch options before the request is sent.
   */
  onRequest?: MaybeArray<
    (path: string, options: FetchRequestInit) => MaybePromise<FetchRequestInit | void>
  >

  /**
   * Callbacks to override or transform the response.
   */
  onResponse?: MaybeArray<(response: Response) => MaybePromise<unknown>>

  /**
   */
  keepDomain?: boolean
}
