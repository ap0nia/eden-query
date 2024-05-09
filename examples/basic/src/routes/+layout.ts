import { createTreatyFetchQuery } from '@ap0nia/eden-svelte-query'
import { QueryClient } from '@tanstack/svelte-query'

import type { App } from '$lib/server'

import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async (event) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnMount: false,
      },
    },
  })

  const eden = createTreatyFetchQuery<App>(
    undefined,
    { fetcher: event.fetch },
    { svelteQueryContext: queryClient },
  )

  return { queryClient, eden }
}
