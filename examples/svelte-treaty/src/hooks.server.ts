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
   *
   * Cannot be passed between server load functions because it is a non-POJO.
   *
   * Passing a value to "dehydrated" will cause SSR queries to merge their state with the
   * dehydrated POJO.
   *
   * It can be used in a `hydrate` call in +layout.svelte to initialize a queryClient.
   */
  const ssrEdenContext = eden.createContext(undefined, { event, dehydrated: true })

  event.locals.eden = ssrEdenContext

  event.locals.dehydrated = ssrEdenContext.dehydrated

  const response = await resolve(event)
  return response
}

export const handle = sequence(contentTypeHandle, edenHandle)
