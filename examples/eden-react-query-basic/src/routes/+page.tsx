import { eden } from '../lib/eden'

export default function Page() {
  const hello = eden.api.index.get.useQuery({})

  return (
    <main>
      <h1>Home</h1>

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
