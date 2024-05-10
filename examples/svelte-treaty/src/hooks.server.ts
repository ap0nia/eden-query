import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

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

export const handle = sequence(contentTypeHandle)
