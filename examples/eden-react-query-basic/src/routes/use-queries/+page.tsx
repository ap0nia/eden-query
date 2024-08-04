import { eden } from '../../lib/eden'

export default function Page() {
  const [hello, bye] = eden.useQueries((e) => {
    return [e.api.index.get(), e.api.bye.get()]
  })

  return (
    <main>
      <h1>Use Queries</h1>

      <p>
        The two queries should be fetched concurrently like the batch example. But this time using
        the useQueries API.
      </p>

      <div>
        {hello.isLoading ? (
          <p>Hello loading...</p>
        ) : hello.isError ? (
          <p>
            <b>Hello Error: </b>
            <span>{hello.error.message}</span>
          </p>
        ) : (
          <p>
            <b>Hello Query: </b>
            <span>{hello.data}</span>
          </p>
        )}
      </div>

      <hr />

      <div>
        {bye.isLoading ? (
          <p>Bye loading...</p>
        ) : bye.isError ? (
          <p>
            <b>Bye Error: </b>
            <span>{bye.error.message}</span>
          </p>
        ) : (
          <p>
            <b>Bye Query: </b>
            <span>{bye.data}</span>
          </p>
        )}
      </div>
    </main>
  )
}
