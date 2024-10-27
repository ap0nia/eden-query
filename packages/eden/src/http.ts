import type { Nullish } from './utils/null'

export interface HeadersInitEsque {
  [Symbol.iterator](): IterableIterator<[string, string]>
}

export type HTTPHeaders = HeadersInitEsque | Record<string, string[] | string | undefined>

export type AbortControllerEsque = new () => AbortControllerInstanceEsque

/**
 * Allows you to abort one or more requests.
 */
export interface AbortControllerInstanceEsque {
  /**
   * The AbortSignal object associated with this object.
   */
  readonly signal: AbortSignal

  /**
   * Sets this object's AbortSignal's aborted flag and signals to
   * any observers that the associated activity is to be aborted.
   */
  abort(): void
}

export type HTTPLinkBaseOptions = {
  /**
   * Define AbortController implementation.
   */
  AbortController?: AbortControllerEsque | null

  /**
   * Send all requests `as POST`s requests regardless of the procedure type.
   * The HTTP handler must separately allow overriding the method.
   *
   * @see https://trpc.io/docs/rpc
   */
  methodOverride?: 'POST'
}

export function getAbortController(
  abortControllerPolyfill?: AbortControllerEsque | Nullish,
): AbortControllerEsque | null {
  if (abortControllerPolyfill) {
    return abortControllerPolyfill
  }

  if (typeof window !== 'undefined' && window.AbortController) {
    return window.AbortController
  }

  if (typeof globalThis !== 'undefined' && globalThis.AbortController) {
    return globalThis.AbortController
  }

  return null
}

export const httpQueryMethods = ['get', 'options', 'head'] as const

export const httpMutationMethods = ['post', 'put', 'patch', 'delete'] as const

export const httpSubscriptionMethods = ['connect', 'subscribe'] as const

export const httpMethods = [
  ...httpQueryMethods,
  ...httpMutationMethods,
  ...httpSubscriptionMethods,
] as const

/**
 * Recognized HTTP methods for queries.
 */
export type HttpQueryMethod = (typeof httpQueryMethods)[number]

/**
 * Recognized HTTP methods for mutations.
 */
export type HttpMutationMethod = (typeof httpMutationMethods)[number]

/**
 * Recognized HTTP methods for subscriptions.
 */
export type HttpSubscriptionMethod = (typeof httpSubscriptionMethods)[number]

/**
 * All recognized HTTP methods.
 */
export type HttMethod = (typeof httpMethods)[number]
