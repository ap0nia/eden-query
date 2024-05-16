import { Elysia } from 'elysia'

import { parseResponse } from '../internal/resolve'
import type { AnyElysia } from '../types'

export type BatchedRequestData = {
  method: string
  path: string
}

export function batchPlugin<T extends AnyElysia>(elysia: T) {
  const instance = new Elysia().post(
    '/batch',
    async (context) => {
      if (context.body == null) return

      const batchedRequests: Record<string, BatchedRequestData> = {}

      Object.entries(context.body).forEach(([key, value]) => {
        const [id, property] = key.split('.')

        if (id == null || property == null) return

        batchedRequests[id] ??= {} as any
        set(batchedRequests[id], property, value)
      })

      const originalUrl = new URL(context.request.url)

      const requests = Object.entries(batchedRequests).reduce(
        (accumulated, [key, value]) => {
          accumulated[key] = new Request(`${originalUrl.origin}${value.path}`)
          return accumulated
        },
        {} as Record<string, Request>,
      )

      const handledRequests = await Promise.allSettled(
        Object.entries(requests).map(async ([id, request]) => {
          return {
            id,
            request,
            response: await elysia.handle(request),
          }
        }),
      ).catch((e) => {
        console.error('Error occurred while handling batched requests: ', e)
        return []
      })

      const results: Record<string, any> = {}

      await Promise.allSettled(
        handledRequests.map(async (handledRequest) => {
          if (handledRequest.status === 'rejected') {
            console.error('Failed to handle request: ', handledRequest.reason)
            return
          }

          results[handledRequest.value.id] = await parseResponse(handledRequest.value.response)
        }),
      ).catch((e) => {
        console.error('Error occurred while parsing batched responses: ', e)
      })

      return results
    },
    {
      type: 'formdata',
    },
  )

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
