import type { EdenConfig as EdenRequestOptions } from '../../config'
import type { HTTPLinkBaseOptions } from '../../http'
import type { EdenResponse } from '../../request'
import { type EdenRequestParams, resolveEdenRequest } from '../../resolve'
import type { Noop } from '../../utils/noop'
import type { Operation } from './operation'

export type Requester = (options: RequesterOptions) => PromiseAndCancel<EdenResponse>

export type RequesterOptions = Operation & HTTPLinkBaseOptions & EdenRequestOptions

export type PromiseAndCancel<T> = {
  promise: Promise<T>
  cancel: Noop
}

/**
 * Default eden HTTP requester normalizes operation options to params.
 */
export const universalRequester: Requester = (options) => {
  const {
    id: _id,
    type: _type,
    AbortController,
    methodOverride,
    params,
    ...defaultParams
  } = options

  const abortController = AbortController ? new AbortController() : null

  let done = false

  const cancel = () => {
    if (!done) {
      abortController?.abort()
    }
  }

  /**
   * @TODO
   *
   * Deep merge fetch, headers, onRequest, onResponse ?
   */
  const resolvedParams: EdenRequestParams = { ...defaultParams, ...params }

  if (options.params.fetch?.signal) {
    options.params.fetch.signal.addEventListener('abort', cancel)
    resolvedParams.fetch ??= {}
    resolvedParams.fetch.signal = abortController?.signal
  }

  if (methodOverride != null) {
    resolvedParams.method = methodOverride
  }

  const promise = new Promise<EdenResponse>((resolve, reject) => {
    resolveEdenRequest(resolvedParams)
      .then((response) => {
        done = true
        resolve(response as EdenResponse)
      })
      .catch((err) => {
        done = true
        reject(err)
      })
  })

  return { promise, cancel }
}
