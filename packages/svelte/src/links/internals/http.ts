import type { Nullish } from '../../utils/null'

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
