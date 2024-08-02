import { eden } from '../lib/eden'

export default function Page() {
  const hello = eden.api.index.get.useQuery({}, { eden: {} })

  const bye = eden.api.bye.get.useQuery({})

  return (
    <main>
      <h1>Hello, World!</h1>

      <div>
        <p>Hello: </p>

        {hello.isLoading ? (
          <p>Loading...</p>
        ) : hello.isError ? (
          <p>Error: {hello.error.message}</p>
        ) : (
          <p>Result: {hello.data}</p>
        )}
      </div>

      <hr />

      <div>
        <p>Bye: </p>
        {bye.isLoading ? (
          <p>Loading...</p>
        ) : bye.isError ? (
          <p>Error: {bye.error.message}</p>
        ) : (
          <p>Result: {bye.data}</p>
        )}
      </div>
    </main>
  )
}
