import { useState } from 'react'

import { eden } from '../../lib/eden'

export default function Page() {
  const [show, setShow] = useState(false)

  const toggle = () => {
    setShow((previous) => !previous)
  }

  return (
    <main>
      <button onClick={toggle}>Toggle Component</button>

      <p>
        The toggle-able component does a long query. If it's hidden before the request ends, then
        the request should be aborted.
      </p>

      {show && <Sleep />}
    </main>
  )
}

function Sleep() {
  const sleep = eden.api.sleep.get.useQuery()

  return (
    <div>
      <p>
        <span>Result: </span>
        {sleep.isLoading ? <span>Loading...</span> : <span>{sleep.data}</span>}
      </p>
    </div>
  )
}
