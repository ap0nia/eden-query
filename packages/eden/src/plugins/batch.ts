import {
  type DefinitionBase,
  Elysia,
  type EphemeralType,
  type MetadataBase,
  type RouteBase,
  type SingletonBase,
} from 'elysia'

import { BATCH_ENDPOINT } from '../constants'
import type { EdenQueryStoreKey } from '../constraints'
import { parseResponse } from '../resolve'
import { createUrl } from '../utils/create-url'
import { set } from '../utils/set'

export type BatchedRequestData = {
  path: string
  method?: string
  body?: any
  body_type?: 'formdata' | 'json'
  headers?: Headers
  query?: URLSearchParams
  rawBody?: Record<string, any>
}

export type BatchPluginOptions = {
  endpoint?: string
}

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
    const [id, property] = key.split('.')

    if (id == null || property == null) continue

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
  }

  return result
}

/**
 */
function unBatchHeaders(request: Request): { requests: Headers[]; shared: Headers } {
  const requests: Headers[] = []
  const shared = new Headers()

  request.headers.forEach((value, key) => {
    const [requestId, headerName] = key.split('.')

    if (Number.isInteger(requestId) && headerName != null) {
      requests[Number(requestId)] ??= new Headers()
      requests[Number(requestId)]?.set(headerName, value)
    } else {
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
 * @fixme:
 *
 * TS 4118 The type of this node cannot be serialized because its property '[EdenQueryStoreKey]' cannot be serialized.
 */
export function batchPlugin(options?: BatchPluginOptions) {
  const plugin = <
    BasePath extends string,
    Scoped extends boolean,
    Singleton extends SingletonBase,
    Definitions extends DefinitionBase,
    Metadata extends MetadataBase,
    Routes extends RouteBase,
    Ephemeral extends EphemeralType,
    Volatile extends EphemeralType,
  >(
    elysia: Elysia<BasePath, Scoped, Singleton, Definitions, Metadata, Routes, Ephemeral, Volatile>,
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
