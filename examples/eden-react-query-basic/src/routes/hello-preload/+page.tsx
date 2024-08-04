import type { LoaderFunction } from 'react-router-dom'

import { eden } from '../../lib/eden'

/**
 * Given a
 */
export function load(utils: ReturnType<typeof eden.useUtils>): LoaderFunction {
  return async () => {
    /**
     * Fetches the query, caches it in the correct queryClient.
     * When the page loads, the query data should already be in the query cache.
     */
    await utils.api.index.get.fetch({})
    return null
  }
}

export default function Page() {
  const hello = eden.api.index.get.useQuery({})
  return (
    <main>
      <h1>Preload</h1>

      <p>Since this page's query has been preloaded, a "loading" message should never be seen.</p>

      <div>
        {hello.isLoading ? (
          <p>Loading...</p>
        ) : hello.isError ? (
          <p>Error: {hello.error.message}</p>
        ) : (
          <p>
            <b>Data: </b>
            <span>{hello.data}</span>
          </p>
        )}
      </div>
    </main>
  )
}
