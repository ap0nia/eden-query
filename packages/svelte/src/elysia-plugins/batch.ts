import { Elysia } from 'elysia'

import { parseResponse } from '../internal/resolve'

export type BatchedRequestData = {
  method: string
  path: string
}

export function batchPlugin(elysia: Elysia) {
  const instance = new Elysia().post('/batch', async (context) => {
    if (context.request.formData == null) return

    const formData = await context.request.formData()

    const batchedRequests: BatchedRequestData[] = []

    for (const [key, value] of formData.entries()) {
      const [id, property] = key.split('.')

      if (id == null || property == null) return

      try {
        const index = +id
        batchedRequests[index] ??= {} as any
        set(batchedRequests[index], property, value)
      } catch (e) {
        console.error(`Failed to add request with key: ${id} to batch: `, e)
      }
    }

    const originalUrl = new URL(context.request.url)

    const batchedResponses = await Promise.allSettled(
      batchedRequests.map(async (batchedRequest) => {
        const request = new Request(`${originalUrl.origin}${batchedRequest.path}`)
        return {
          request,
          response: await elysia.handle(request),
        }
      }),
    ).catch((e) => {
      console.error('Error occurred while handling batched requests: ', e)
      return []
    })

    const parsedResponses = await Promise.all(
      batchedResponses.map(async (handledRequest) => {
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

  return elysia.use(instance)
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
