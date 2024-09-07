import { keepPreviousData } from '@tanstack/react-query'
import { useState } from 'react'

import { eden, type InferInput } from '../../lib/eden'

export default function Page() {
  const [input, setInput] = useState<InferInput['api']['names']['get']['query']>({
    search: '',
  })

  const [id, setId] = useState(1)

  const { data } = eden.api.products({ id }).get.useQuery(input, {
    /**
     * This prevents the data from disappearing briefly when loading up the next query.
     */
    placeholderData: keepPreviousData,
  })

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput((current) => {
      current.search = event.target.value
      return current
    })
  }

  const handleIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setId(event.target.valueAsNumber)
  }

  return (
    <main>
      <h1>Reactive Input</h1>

      <p>Matching Names</p>

      <p>The developer can optimize this reactive input by using debounce...</p>

      <p>{data}</p>

      <label>
        <p>Search for a name by typing into the box</p>
        <input
          type="text"
          onChange={handleNameChange}
          value={input.search}
          placeholder="Enter name here..."
        />
        <input type="number" onChange={handleIdChange} />
      </label>
    </main>
  )
}
