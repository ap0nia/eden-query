import { eden } from '../../lib/eden'

export default function Page() {
  /**
   * Path parameter is needed, but not query.
   */
  const withParam = eden.api.nendoroid({ id: 1895 }).put.useMutation()

  /**
   * Both query and path parameters are needed. Query is provided in `mutate` function.
   */
  const withParamQuery = eden.api.nendoroid({ id: 1895 }).patch.useMutation()

  const handleParamMutation = async () => {
    withParam.mutateAsync({ from: '', name: '' }, {})
  }

  const handleQueryParamMutation = async () => {
    withParamQuery.mutateAsync({ from: '', name: '' }, { query: { location: '' } })
  }

  // const bruh = eden.useUtils()

  // eden.api.nendoroid({ id: 1 })

  return (
    <main>
      <button onClick={handleParamMutation}>Params only</button>
      <button onClick={handleQueryParamMutation}>Params with query</button>
    </main>
  )
}
