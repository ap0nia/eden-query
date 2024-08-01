import { createEdenTreatyReactQuery, httpBatchLink } from '@elysiajs/eden-react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

import type { App as ElysiaApp } from '../server'

export const eden = createEdenTreatyReactQuery<ElysiaApp>()

export function App() {
  const [queryClient] = useState(() => new QueryClient())

  const [trpcClient] = useState(() => {
    return eden.createClient({
      links: [
        httpBatchLink({
          endpoint: 'http://localhost:3000/trpc',
        }),
      ],
    })
  })

  return (
    <eden.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <main>
          <h1>Hello, World!</h1>
        </main>
      </QueryClientProvider>
    </eden.Provider>
  )
}
