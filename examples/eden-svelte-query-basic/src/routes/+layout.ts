import { QueryClient } from '@tanstack/svelte-query'

import { browser } from '$app/environment'
import { eden } from '$lib/eden'

import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async (event) => {
  /**
   * Generate a new query client for each user's request.
   *
   * When prefetching queries in load functions, this QueryClient's cache
   * will be populated and merged in the application's root layout.
   */
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
        refetchOnMount: false,
      },
    },
  })

  const edenUtils = eden.createContext(queryClient, {
    /**
     * The SvelteKit specific `fetch` implementation must be used for pre-fetching in load functions.
     */
    fetcher: event.fetch,
  })

  return { queryClient, eden: edenUtils, dehydrated: event.data.dehydrated }
}
