import { httpBatchLink } from '@elysiajs/eden-react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { eden } from './lib/eden'
import Home from './routes/index'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
])

export function App() {
  const [queryClient] = useState(() => new QueryClient())

  const [edenClient] = useState(() => {
    return eden.createClient({
      links: [
        httpBatchLink({
          endpoint: 'http://localhost:3000/api',
        }),
      ],
    })
  })

  return (
    <eden.Provider client={edenClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </eden.Provider>
  )
}
