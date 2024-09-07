import { eden } from '../../lib/eden'

export default function Page() {
  const hello = eden.api.index.get.useQuery()

  const bye = eden.api.bye.get.useQuery()

  return (
    <main>
      <h1>Batch</h1>

      <p>
        Because two queries are launched concurrently, the request is actually made to a /batch
        endpoint.
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
