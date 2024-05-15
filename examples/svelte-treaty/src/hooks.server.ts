import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

import { eden } from '$lib/eden'

/**
 * Eden reads 'content-type' header, so this needs to be allowed.
 * @see https://github.com/elysiajs/eden/blob/main/src/fetch/index.ts#L53
 */
const contentTypeHandle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event, {
    filterSerializedResponseHeaders: (name) => name.startsWith('content-type'),
  })
  return response
}

const edenHandle: Handle = async ({ event, resolve }) => {
  /**
   * SSR eden utilities for this request.
   */
  event.locals.eden = eden.createContext(undefined, { event })
  const response = await resolve(event)
  return response
}

export const handle = sequence(contentTypeHandle, edenHandle)
