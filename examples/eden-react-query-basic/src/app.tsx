import { httpBatchLink } from '@elysiajs/eden-react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { createBrowserRouter, Link, Outlet, RouterProvider } from 'react-router-dom'
import SuperJSON from 'superjson'

import { eden } from './lib/eden'
import Home from './routes/+page'
import HelloPreload, { load as helloPreloadLoader } from './routes/hello-preload/+page'

export function App() {
  const [queryClient] = useState(() => new QueryClient())

  const [client] = useState(() => {
    return eden.createClient({
      links: [
        httpBatchLink({
          domain: 'http://localhost:3000',
          transformer: SuperJSON,
        }),
      ],
    })
  })

  const [utils] = useState(() => {
    /**
     * Raw context that's __not__ connected to React's context system.
     */
    const context = eden.createContext({ queryClient, client })

    /**
     * Use the context object to create utilities that act on the same queryClient and edenClient.
     * This can be provided to load functions that run before context is rendered by React.
     */
    return eden.createUtils(context)
  })

  const [router] = useState(() => {
    return createBrowserRouter([
      {
        element: (
          <>
            <header>
              <nav>
                <ul>
                  <li>
                    <Link to="/">home</Link>
                  </li>
                  <li>
                    <Link to="/hello-preload">hello with preloading</Link>
                  </li>
                  <li>
                    <Link to="/hello-ssr">hello with ssr</Link>
                  </li>
                  <li>
                    <Link to="/batch">batch</Link>
                  </li>
                  <li>
                    <Link to="/mutation">mutation example with todos</Link>
                  </li>
                  <li>
                    <Link to="/reactive-input">reactive input box</Link>
                  </li>
                  <li>
                    <Link to="/abort">abort</Link>
                  </li>
                </ul>
              </nav>
            </header>

            <Outlet />
          </>
        ),
        children: [
          {
            path: '/',
            element: <Home />,
          },
          {
            path: '/hello-preload',
            element: <HelloPreload />,
            loader: helloPreloadLoader(utils),
          },
        ],
      },
    ])
  })

  return (
    <eden.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </eden.Provider>
  )
}
