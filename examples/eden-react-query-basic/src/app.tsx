import { httpBatchLink } from '@ap0nia/eden-react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { createBrowserRouter, Link, Outlet, RouterProvider } from 'react-router-dom'
import SuperJSON from 'superjson'

import { eden } from './lib/eden'
import HomePage from './routes/+page'
import AbortPage from './routes/abort/+page'
import BatchPage from './routes/batch/+page'
import HelloPreloadPage, { load as helloPreloadLoader } from './routes/hello-preload/+page'
import InfinitePage from './routes/infinite/+page'
import MutationPage from './routes/mutation/+page'
import MutationOnSuccessInvalidatePage from './routes/mutation-on-success-invalidate/+page'
import MutationQueryParamPage from './routes/mutation-query-params/+page'
import ReactiveInputPage from './routes/reactive-input/+page'
import ReactiveParamsPage from './routes/reactive-params/+page'
import UseQueriesPage from './routes/use-queries/+page'

export function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnMount: false,
          },
        },
      }),
  )

  const [client] = useState(() => {
    return eden.createClient({
      links: [
        httpBatchLink({
          endpoint: '/api/batch',
          transformer: SuperJSON,
          domain: 'http://localhost:3000',
          maxURLLength: 123,
          method: 'POST',
        }),
      ],
    })
  })

  const [utils] = useState(() => {
    /**
     * Use the context object to create utilities that act on the same queryClient and edenClient.
     * This can be provided to load functions that run before context is rendered by React.
     */
    const utils = eden.createUtils({ queryClient, client })
    return utils
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
                  <li style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    {/* This is a single-page application with Vite, no SSR */}
                    hello with ssr
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
                    <Link to="/reactive-params">reactive params</Link>
                  </li>
                  <li>
                    <Link to="/mutation-query-params">
                      mutation with query and path parameter input
                    </Link>
                  </li>
                  <li>
                    <Link to="/mutation-on-success-invalidate">
                      mutation with on success and invalidation
                    </Link>
                  </li>
                  <li>
                    <Link to="/abort">abort</Link>
                  </li>
                  <li>
                    <Link to="/infinite">infinite</Link>
                  </li>
                  <li>
                    <Link to="/use-queries">use-queries</Link>
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
            element: <HomePage />,
          },
          {
            path: '/hello-preload',
            element: <HelloPreloadPage />,
            loader: helloPreloadLoader(utils),
          },
          {
            path: '/batch',
            element: <BatchPage />,
          },
          {
            path: '/mutation',
            element: <MutationPage />,
          },
          {
            path: '/mutation-query-params',
            element: <MutationQueryParamPage />,
          },
          {
            path: '/mutation-on-success-invalidate',
            element: <MutationOnSuccessInvalidatePage />,
          },
          {
            path: '/abort',
            element: <AbortPage />,
          },
          {
            path: '/reactive-input',
            element: <ReactiveInputPage />,
          },
          {
            path: '/reactive-params',
            element: <ReactiveParamsPage />,
          },
          {
            path: '/infinite',
            element: <InfinitePage />,
          },
          {
            path: '/use-queries',
            element: <UseQueriesPage />,
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
