import { eden } from '../../lib/eden'

export default function Page() {
  const pages = eden.api.pages.get.useInfiniteQuery(undefined, {
    getNextPageParam: (_lastPage, _allPages, lastPageParams, _allPageParams) => {
      return (lastPageParams ?? 0) + 1
    },
  })

  const getNextPage = async () => {
    await pages.fetchNextPage()
  }

  return (
    <main>
      <h1>Infinite Query</h1>

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
