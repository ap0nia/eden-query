import { eden } from '../../lib/eden'

export default function Page() {
  const pages = eden.api.pages.get.useInfiniteQuery(
    /**
     * When the `query` property is defined, the `cursor` property will automatically be set
     * for the request if it exists.
     *
     * Likewise if the `params` property was defined.
     *
     * @todo: Deterministically distinguish whether `query.cursor` or `params.cursor` should be set...
     */
    { query: {} },
    {
      getNextPageParam: (_lastPage, _allPages, lastPageParams, _allPageParams) => {
        return (lastPageParams ?? 0) + 1
      },
    },
  )

  const getNextPage = async () => {
    await pages.fetchNextPage()
  }

  return (
    <main>
      <ul>
        {pages.data?.pages.map((page, index) => {
          return (
            <li key={index}>
              Page: {index}
              <ul>
                {page?.map((p, index) => {
                  return (
                    <li key={index}>
                      <b>Item Index: {index}</b>
                      <p>{p}</p>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>

      <button onClick={getNextPage}>Get Next Page</button>
    </main>
  )
}
