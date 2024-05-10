import { createEdenTreatyQuery } from '@ap0nia/eden-svelte-query'
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

  const eden = createEdenTreatyQuery<App>(undefined).config({ queryClient, fetcher: event.fetch })

  return { queryClient, eden }
}
