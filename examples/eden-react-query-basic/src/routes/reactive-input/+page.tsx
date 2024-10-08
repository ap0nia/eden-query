import { keepPreviousData } from '@tanstack/react-query'
import { useState } from 'react'

import { eden, type InferInput } from '../../lib/eden'

export default function Page() {
  const [input, setInput] = useState<InferInput['api']['names']['get']['query']>({
    search: '',
  })

  const names = eden.api.names.get.useQuery(input, {
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

  return (
    <main>
      <h1>Reactive Input</h1>

      <p>Matching Names</p>

      <p>The developer can optimize this reactive input by using debounce...</p>

      <ul>
        {names.data?.map((name, index) => {
          return <li key={index}>{name}</li>
        })}
      </ul>

      <label>
        <p>Search for a name by typing into the box</p>
        <input
          type="text"
          onChange={handleNameChange}
          value={input.search}
          placeholder="Enter name here..."
        />
      </label>
    </main>
  )
}
