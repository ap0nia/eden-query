import type { EdenRequestOptions, EdenResponse } from '../../internal/request'
import { type EdenRequestParams, resolveEdenRequest } from '../../internal/resolve'
import type { Noop } from '../../utils/noop'
import type { HTTPLinkBaseOptions } from './http'
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

  const signal = options.params.signal ?? options.signal

  signal?.addEventListener('abort', cancel)

  const resolvedParams: EdenRequestParams = {
    ...defaultParams,
    ...params,
    domain: '',
    method: methodOverride,
    signal: abortController?.signal,
  }

  const promise = new Promise<EdenResponse>((resolve, reject) => {
    resolveEdenRequest(resolvedParams)
      .then((response) => {
        done = true
        resolve(response)
      })
      .catch((err) => {
        done = true
        reject(err)
      })
  })

  return { promise, cancel }
}
