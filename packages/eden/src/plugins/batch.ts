import { Elysia } from 'elysia'

import { BATCH_ENDPOINT } from '../constants'
import { parseResponse } from '../resolve'

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

async function unBatchRequests(request: Request): Promise<BatchedRequestData[]> {
  const batchedRequests = await unBatchRequestData(request)
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

async function unBatchRequestData(request: Request): Promise<BatchedRequestData[]> {
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

function createUrl(path: string, query?: URLSearchParams): string {
  return path + (query?.size ? `?${query.toString()}` : '')
}

export function batchPlugin(options?: BatchPluginOptions) {
  return (elysia: Elysia) => {
    const endpoint = options?.endpoint ?? BATCH_ENDPOINT

    const instance = new Elysia()
      /**
       * Handler for batch requests using POST.
       */
      .post(endpoint, async (context) => {
        const requests = await unBatchRequests(context.request)

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

    // Assert that the return type is the same as the input type so this route is hidden.
    return elysia.use(instance) as typeof elysia
  }
}

/**
 * Given a dot-concatenated string path, deeply set a property, filling in any missing objects along the way.
 */
export function set<T>(obj: unknown, key: PropertyKey, value: unknown): T {
  if (obj == null) {
    return value as any
  }

  if (typeof key === 'number' || typeof key === 'symbol') {
    obj[key as keyof typeof obj] = value as never
    return obj[key as keyof typeof obj] as T
  }

  const keyArray = key
    .replace(/["|']|\]/g, '')
    .split(/\.|\[/)
    .filter(Boolean)

  const lastIndex = keyArray.length - 1

  const lastKey = keyArray[lastIndex]

  const result = keyArray.reduce((currentResult, currentKey, index) => {
    if (index === lastIndex) {
      currentResult[currentKey as keyof typeof currentResult] = value as never
      return currentResult
    }

    currentResult[currentKey as keyof typeof currentResult] ??= (
      isNaN(keyArray[index + 1] as any) ? {} : []
    ) as never

    return currentResult[currentKey as keyof typeof currentResult]
  }, obj)

  return result[lastKey as keyof typeof result] as T
}
