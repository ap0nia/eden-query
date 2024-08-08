import { httpBatchLink } from '@ap0nia/eden-svelte-query'
import { QueryClient } from '@tanstack/svelte-query'
import SuperJSON from 'superjson'

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

  const client = eden.createClient({
    links: [
      httpBatchLink({
        endpoint: '/api/batch',
        transformer: SuperJSON,
        fetcher: event.fetch,
      }),
    ],
  })

  const edenUtils = eden.createUtils({ client, queryClient })

  return { client, queryClient, eden: edenUtils, dehydrated: event.data.dehydrated }
}
