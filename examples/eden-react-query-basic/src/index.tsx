import {} from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app'

const rootElementId = 'root'

function main() {
  let element = document.getElementById(rootElementId)

  if (element == null) {
    console.error('Please create a root element in the template...')
    element = document.createElement('div')
    document.body.append(element)
  }

  const root = createRoot(element)

  root.render(<App />)
}

main()
