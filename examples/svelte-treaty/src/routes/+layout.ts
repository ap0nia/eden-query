import { QueryClient } from '@tanstack/svelte-query'

import { eden } from '$lib/eden'

import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async (event) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnMount: false,
      },
    },
  })

  const edenUtils = eden.createContext(undefined, { queryClient, fetcher: event.fetch })

  return {
    queryClient,
    eden: edenUtils,
    dehydrated: event.data.dehydrated,
  }
}
