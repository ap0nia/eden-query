import { eden } from '../../lib/eden'

export default function Page() {
  const helloQuery = eden.api.index.useQuery()
  const utils = eden.useUtils()
  const hello = eden.api.nendoroid({ id: 1895 }).put.useMutation({
    onSuccess: () => {
      utils.api.index.invalidate()
    },
  })

  return (
    <main>
      <button
        onClick={() => {
          hello.mutateAsync({ from: 'hello', name: 'world' })
        }}
      >
        Mutate and Invalidate
      </button>
      <pre>data: {JSON.stringify(helloQuery.data, null, 2)}</pre>
      <pre>dataUpdatedAt: {JSON.stringify(helloQuery.dataUpdatedAt, null, 2)}</pre>
    </main>
  )
}
