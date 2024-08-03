import { httpBatchLink } from '@elysiajs/eden-react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import SuperJSON from 'superjson'

import { eden } from './lib/eden'
import Home from './routes/+page'

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
          domain: 'http://localhost:3000',
          transformer: SuperJSON,
        }),
      ],
    })
  })

  return (
    <eden.Provider client={edenClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <header>
          <nav>
            <ul>
              <li>
                <a href="/">home</a>
              </li>
              <li>
                <a href="/hello-preload">hello with preloading</a>
              </li>
              <li>
                <a href="/hello-ssr">hello with ssr</a>
              </li>
              <li>
                <a href="/batch">batch</a>
              </li>
              <li>
                <a href="/mutation">mutation example with todos</a>
              </li>
              <li>
                <a href="/reactive-input">reactive input box</a>
              </li>
              <li>
                <a href="/abort">abort</a>
              </li>
            </ul>
          </nav>
        </header>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </eden.Provider>
  )
}
