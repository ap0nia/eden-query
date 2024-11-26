import type { EdenConfig as EdenRequestOptions } from '../../config'
import type { HTTPLinkBaseOptions } from '../../http'
import type { EdenResponse } from '../../request'
import { type EdenRequestParams as EdenRequestParameters, resolveEdenRequest } from '../../resolve'
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
    ...defaultParameters
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
  const resolvedParameters: EdenRequestParameters = { ...defaultParameters, ...params }

  if (options.params.fetch?.signal) {
    options.params.fetch.signal.addEventListener('abort', cancel)
    resolvedParameters.fetch = { ...resolvedParameters.fetch, signal: abortController?.signal }
  }

  if (methodOverride != undefined) {
    resolvedParameters.method = methodOverride
  }

  const promise = new Promise<EdenResponse>((resolve, reject) => {
    resolveEdenRequest(resolvedParameters)
      .then((response) => {
        done = true
        resolve(response as EdenResponse)
      })
      .catch((error) => {
        done = true
        reject(error)
      })
  })

  return { promise, cancel }
}
