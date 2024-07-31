import { QueryClient } from '@tanstack/svelte-query'

import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async (_event) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnMount: false,
      },
    },
  })

  return { queryClient }
}
