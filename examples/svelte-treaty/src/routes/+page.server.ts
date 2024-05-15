import { mergeDyhdrated } from '$lib/eden'

import type { PageServerLoad } from './$types'

/**
 * Enable SSR by making queries with the utilities API and merging the dehydrated state
 * with the root layout's.
 *
 * Merging the dehydrated state is a work around for SvelteKit not allowing non-POJOS
 * to be passed between server load functions.
 */
export const load: PageServerLoad = async (event) => {
  await event.locals.eden.api.index.get.fetch({})

  const { ssrCache } = await event.parent()

  mergeDyhdrated(ssrCache, event.locals.eden.queryClient)
}
