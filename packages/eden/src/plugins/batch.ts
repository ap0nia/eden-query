import { Elysia } from 'elysia'

import { BATCH_ENDPOINT } from '../constants'
import type { EdenQueryStoreKey } from '../constraints'
import { parseResponse } from '../resolve'
import { createUrl } from '../utils/create-url'
import { set } from '../utils/set'
import type { GenericElysiaPlugin } from './types'

/**
 * Individual request data that can be extracted from a {@link Request} that contains
 * information about multiple requests.
 */
export type BatchedRequestData = {
  /**
   * The path for this request.
   */
  path: string

  /**
   * The HTTP method for this request.
   */
  method?: string

  /**
   * The body of the request. It may either be JSON or FormData.
   */
  body?: any

  /**
   * The type of the body.
   */
  body_type?: 'formdata' | 'json'

  /**
   * All headers specifically for the request.
   */
  headers?: Headers

  /**
   * Any query parameters for the request.
   */
  query?: URLSearchParams
}

export type BatchPluginOptions = {
  endpoint?: string
}

/**
 * @param body The body from the elysia handler context. It should be null if the request contained formData.
 */
async function unBatchRequests(request: Request, body?: any): Promise<BatchedRequestData[]> {
  const batchedRequests = body
    ? unBatchRequestJsonData(body)
    : await unBatchRequestFormData(request)

  const batchedHeaders = unBatchHeaders(request)

  const batchedQueries = unBatchQueries(request)

  // Zip batched headers with batched requests.
  for (const index in batchedHeaders.requests) {
    const current = batchedRequests[index]
    if (current != null) {
      current.headers ??= batchedHeaders.requests[index]
    }
  }

  // Set headers for all requests.
  batchedHeaders.shared.forEach((value, key) => {
    batchedRequests.forEach((batchedRequest) => {
      if (!batchedRequest.headers?.get(key)) {
        batchedRequest.headers ??= new Headers()
        batchedRequest.headers.set(key, value)
      }
    })
  })

  // Zip batched queries with batched requests.
  for (const index in batchedQueries) {
    const current = batchedRequests[index]
    if (current != null) {
      current.query ??= batchedQueries[index]
    }
  }

  // Convert body if necessary.
  batchedRequests.forEach((request) => {
    switch (request.body_type) {
      case 'formdata': {
        const body = new FormData()

        if (typeof request.body === 'object') {
          for (const [key, value] of Object.entries(request.body)) {
            body.set(key, value as any)
          }
        }

        request.body = body
        break
      }

      case 'json': {
        request.headers?.set('content-type', 'application/json')
        break
      }
    }
  })

  return batchedRequests
}

async function unBatchRequestFormData(request: Request): Promise<BatchedRequestData[]> {
  const result: BatchedRequestData[] = []

  const formData = await request.formData?.()

  if (formData == null) {
    return result
  }

  // Unbatch basic request information.
  formData.forEach((value, key) => {
    const [id, property] = key.split('.')

    if (id == null || property == null) return

    try {
      const index = Number(id)
      const definedResult: any = { ...result[index] }

      set(definedResult, property, value)

      if (property.startsWith('body')) {
        const [_prefix, bodyKey] = property.split('.')

        if (bodyKey != null) {
          definedResult.rawBody ??= {}
          definedResult.rawBody[bodyKey] = value
        }
      }

      result[index] = definedResult
    } catch (e) {
      console.error(`Failed to add request with key: ${id} to batch: `, e)
    }
  })

  return result
}

function unBatchRequestJsonData(body: Record<string, any>): BatchedRequestData[] {
  const result: BatchedRequestData[] = []

  // Unbatch basic request information.
  for (const [key, value] of Object.entries(body)) {
    const [id, property, maybeQueryKey] = key.split('.')

    if (id == null || property == null) continue

    try {
      const index = Number(id)
      const definedResult: any = { ...result[index] }

      if (property === 'query') {
        definedResult.query ??= new URLSearchParams()
        definedResult.query.append(maybeQueryKey, value)
      } else if (property.startsWith('body')) {
        const [_prefix, bodyKey] = property.split('.')
        if (bodyKey != null) {
          definedResult.rawBody ??= {}
          definedResult.rawBody[bodyKey] = value
        }
      } else {
        set(definedResult, property, value)
      }

      result[index] = definedResult
    } catch (e) {
      console.error(`Failed to add request with key: ${id} to batch: `, e)
    }
  }

  return result
}

/**
 * Temporary fix to ignore these headers from the batch request.
 */
const ignoreHeaders = ['content-type', 'content-length']

function unBatchHeaders(request: Request): { requests: Headers[]; shared: Headers } {
  const requests: Headers[] = []
  const shared = new Headers()

  request.headers.forEach((value, key) => {
    const [requestId, headerName] = key.split('.')

    if (Number.isInteger(requestId) && headerName != null) {
      requests[Number(requestId)] ??= new Headers()
      requests[Number(requestId)]?.set(headerName, value)
    } else if (!ignoreHeaders.includes(key)) {
      shared.set(key, value)
    }
  })

  return { requests, shared }
}

function unBatchQueries(request: Request): URLSearchParams[] {
  const result: URLSearchParams[] = []

  const requestUrl = new URL(request.url)

  for (const [key, value] of requestUrl.searchParams.entries()) {
    const [requestId, queryName] = key.split('.')

    if (Number.isNaN(requestId) || queryName == null) continue
    result[Number(requestId)] ??= new URLSearchParams()
    result[Number(requestId)]?.append(queryName, value)
  }

  return result
}

/**
 * This may result in a TS error if you have "declaration": true in your tsconfig.
 * TS 4118 The type of this node cannot be serialized because its property '[EdenQueryStoreKey]' cannot be serialized.
 */
export function safeBatchPlugin(options?: BatchPluginOptions) {
  const plugin = <BasePath extends string>(
    elysia: Elysia<BasePath>,
  ): Elysia<
    BasePath,
    false,
    {
      decorator: {}
      store: Record<typeof EdenQueryStoreKey, { batch: true }>
      derive: {}
      resolve: {}
    }
  > => {
    const endpoint = options?.endpoint ?? BATCH_ENDPOINT

    const instance = new Elysia()
      /**
       * Handler for batch requests using POST.
       */
      .post(endpoint, async (context) => {
        const requests = await unBatchRequests(context.request, context.body)

        const originalUrl = new URL(context.request.url)

        const responses = await Promise.allSettled(
          requests.map(async (batchedRequest) => {
            // TODO: how to handle this?

            const fullPath = `${originalUrl.origin}${batchedRequest.path}`

            const requestUrl = createUrl(fullPath, batchedRequest.query)

            const request = new Request(requestUrl, batchedRequest)

            const response = await elysia.handle(request)

            return { request, response }
          }),
        ).catch((e) => {
          console.error('Error occurred while handling batched requests: ', e)
          return []
        })

        const parsedResponses = await Promise.all(
          responses.map(async (handledRequest) => {
            if (handledRequest.status === 'rejected') {
              console.error('Failed to handle request: ', handledRequest.reason)
              return
            }

            const result = await parseResponse(handledRequest.value.response).catch((e) => {
              console.error('Failed to parse response: ', e)
            })

            return result
          }),
        )

        return parsedResponses
      })
      /**
       * Handler for batch requests using GET.
       */
      .get(endpoint, async (context) => {
        const requests: BatchedRequestData[] = []

        const requestUrl = new URL(context.request.url)

        for (const [key, value] of requestUrl.searchParams.entries()) {
          const [requestIndex, methodOrQuery, queryKey] = key.split('.')

          const numericRequestIndex = Number(requestIndex)

          if (Number.isNaN(numericRequestIndex) || methodOrQuery == null) continue

          const current: BatchedRequestData = requests[numericRequestIndex] ?? ({} as any)

          switch (methodOrQuery) {
            case 'method': {
              current.method = value
              break
            }
            case 'query': {
              if (queryKey != null) {
                current.query ??= new URLSearchParams()
                current.query.append(queryKey, value)
              }
            }
          }

          requests[numericRequestIndex] = current
        }

        const originalUrl = new URL(context.request.url)

        const responses = await Promise.allSettled(
          requests.map(async (batchedRequest) => {
            const fullPath = `${originalUrl.origin}${batchedRequest.path}`

            const requestUrl = createUrl(fullPath, batchedRequest.query)

            const request = new Request(requestUrl, batchedRequest)

            const response = await elysia.handle(request)

            return { request, response }
          }),
        ).catch((e) => {
          console.error('Error occurred while handling batched requests: ', e)
          return []
        })

        const parsedResponses = await Promise.all(
          responses.map(async (handledRequest) => {
            if (handledRequest.status === 'rejected') {
              console.error('Failed to handle request: ', handledRequest.reason)
              return
            }

            const result = await parseResponse(handledRequest.value.response).catch((e) => {
              console.error('Failed to parse response: ', e)
            })

            return result
          }),
        )

        return parsedResponses
      })

    return elysia.use(instance) as any
  }

  return plugin
}

export function batchPlugin<T extends Elysia = Elysia>(
  options?: BatchPluginOptions,
): GenericElysiaPlugin<T> {
  return safeBatchPlugin(options) as any
}
