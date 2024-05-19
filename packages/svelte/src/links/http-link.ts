import { EdenWS } from '@elysiajs/eden/treaty'

import { IS_SERVER } from '../constants'
import type { EdenRequestOptions } from '../internal/config'
import { resolveWsOrigin } from '../internal/http'
import { type EdenResponse, parseResponse, processHeaders } from '../internal/resolve'
import type { AnyElysia } from '../types'
import { buildQuery } from '../utils/build-query'
import { createNewFile, hasFile } from '../utils/file'
import type { Noop } from '../utils/noop'
import {
  type AbortControllerEsque,
  getAbortController,
  type HTTPLinkBaseOptions,
} from './internals/http'
import { Observable } from './internals/observable'
import type { EdenLink, Operation, OperationLink } from './internals/operation'

export type PromiseAndCancel<T> = {
  promise: Promise<T>
  cancel: Noop
}

export type HTTPLinkFactoryOptions = {
  requester: Requester
}

export type HTTPLinkOptions = HTTPLinkBaseOptions & EdenRequestOptions

export type ResolvedHTTPLinkOptions = {
  fetch?: typeof fetch
  AbortController: AbortControllerEsque | null
  methodOverride?: 'POST'
}

export type HTTPLinkFactory = <T extends AnyElysia>(linkOptions: HTTPLinkOptions) => EdenLink<T>

export type Requester = (options: RequesterOptions) => PromiseAndCancel<EdenResponse>

export type RequesterOptions = Operation & ResolvedHTTPLinkOptions

async function resolveEdenRequester(options: RequesterOptions) {
  let endpoint = options.params.endpoint ?? ''

  if (options?.params != null) {
    Object.entries(options.params).forEach(([key, value]) => {
      endpoint = endpoint.replace(`:${key}`, value as string)
    })
  }

  const providedHeaders = options.params.input?.headers ?? options.params.headers

  const headers = processHeaders(providedHeaders, endpoint, options)

  const providedQuery = options.params.input?.query

  const query = buildQuery(providedQuery)

  if (options.params.method === 'subscribe') {
    const wsOrigin = resolveWsOrigin(options.params.domain)
    const url = wsOrigin + endpoint + query
    return new EdenWS(url)
  }

  let fetchInit = {
    method: options.params.method?.toUpperCase(),
    body: options.params.input?.body as any,
    ...options.params.fetchInit,
    headers,
  } satisfies RequestInit

  const isGetOrHead =
    options.params.method == null ||
    options.params.method === 'get' ||
    options.params.method === 'head' ||
    options.params.method === 'subscribe'

  if (isGetOrHead) {
    delete fetchInit.body
  }

  if (options.params.onRequest != null) {
    const onRequest = Array.isArray(options.params.onRequest)
      ? options.params.onRequest
      : [options.params.onRequest]

    for (const value of onRequest) {
      const temp = await value(endpoint, fetchInit)

      if (typeof temp === 'object') {
        fetchInit = {
          ...fetchInit,
          ...temp,
          headers: {
            ...fetchInit.headers,
            ...processHeaders(temp.headers, endpoint, fetchInit),
          },
        }
      }
    }
  }

  /**
   * Repeat because end-user may add a body in {@link config.onRequest}.
   */
  if (isGetOrHead) {
    delete fetchInit.body
  }

  if (!isGetOrHead) {
    if (fetchInit.body instanceof FormData) {
      // noop
    } else if (fetchInit.body != null && hasFile(fetchInit.body)) {
      const formData = new FormData()

      // FormData is 1 level deep
      for (const [key, field] of Object.entries(fetchInit.body)) {
        if (IS_SERVER) {
          formData.append(key, field as any)
          continue
        }

        if (field instanceof File) {
          formData.append(key, await createNewFile(field as any))
          continue
        }

        if (field instanceof FileList) {
          for (const file of field) {
            formData.append(key, await createNewFile(file))
          }
          continue
        }

        if (Array.isArray(field)) {
          for (const value of field) {
            formData.append(key, value instanceof File ? await createNewFile(value) : value)
          }
          continue
        }

        formData.append(key, field as string)
      }
    } else if (typeof fetchInit.body === 'object') {
      fetchInit.headers['content-type'] = 'application/json'
      fetchInit.body = JSON.stringify(fetchInit.body)
    } else if (fetchInit.body !== null) {
      fetchInit.headers['content-type'] = 'text/plain'
    }
  }

  const url = (options.params.domain ?? '') + endpoint + query

  const fetch = options.fetch ?? options.params.fetch ?? globalThis.fetch

  const request = new Request(url, fetchInit)

  const response = await (options.params.elysia?.handle(request) ?? fetch(request))

  if (options.params.onResponse != null) {
    const onResponse = Array.isArray(options.params.onResponse)
      ? options.params.onResponse
      : [options.params.onResponse]

    for (const value of onResponse) {
      await value(response)
    }
  }

  const parsedResponse = await parseResponse(response)

  return parsedResponse
}

/**
 * Default eden HTTP requester.
 */
export const universalRequester: Requester = (options) => {
  const abortController = options.AbortController ? new options.AbortController() : null

  let done = false

  const cancel = () => {
    if (!done) {
      abortController?.abort()
    }
  }

  options.params.signal?.addEventListener('abort', cancel)

  /**
   * Shallow-clone options and pass down signal if abortController exists.
   */
  const resolvedOptions =
    abortController != null
      ? {
          ...options,
          params: { ...options.params, signal: abortController?.signal },
        }
      : options

  const promise = new Promise<EdenResponse>((resolve, reject) => {
    resolveEdenRequester(resolvedOptions)
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

export function httpLinkFactory(factoryOptions: HTTPLinkFactoryOptions): HTTPLinkFactory {
  const factory: HTTPLinkFactory = (linkOptions) => {
    const link: EdenLink = (_runtime) => {
      const operationLink: OperationLink = ({ operation }) => {
        const observable = new Observable((subscriber) => {
          const { fetch, AbortController, methodOverride, ...defaultParams } = linkOptions

          const { id, context, type, ...operationParams } = operation

          const options = {
            fetch,
            AbortController: getAbortController(AbortController),
            methodOverride,
            id,
            context,
            type,
            params: { ...defaultParams, ...operationParams },
          }

          const { promise, cancel } = factoryOptions.requester(options)

          promise
            .then((result) => {
              subscriber.next(result)
              subscriber.complete()
            })
            .catch((cause) => {
              subscriber.error(cause)
            })

          return () => {
            cancel()
          }
        })

        return observable
      }

      return operationLink
    }

    return link
  }

  return factory
}

/**
 * @link https://trpc.io/docs/v11/client/links/httpLink
 */
export const httpLink = httpLinkFactory({ requester: universalRequester })
