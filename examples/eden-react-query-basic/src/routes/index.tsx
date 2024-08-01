import { eden } from '../lib/eden'

export default function Page() {
  const hello = eden.api.index.get.useQuery({})
  const bye = eden.api.bye.get.useQuery({})

  return (
    <main>
      <h1>Hello, World!</h1>
      {hello.isLoading ? (
        <p>Loading...</p>
      ) : hello.isError ? (
        <p>Error: {hello.error.message}</p>
      ) : (
        <p>Result: {hello.data}</p>
      )}
      bruh: {bye.data}
    </main>
  )
}
