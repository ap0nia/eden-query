import {} from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app'

/**
 * The HTML template, e.g. index.html, should look like this:
 *
 * <html lang="en">
 *   <body>
 *     <div id={ROOT_ELEMENT_ID}></div>
 *     <script type="module" src={PATH TO THIS FILE, e.g. '/src/index.tsx'}></script>
 *   </body>
 * </html>
 */
const ROOT_ELEMENT_ID = 'root'

function ensureRootElement(id: string): Element {
  let element = document.querySelector(`#${id}`)

  if (element == null) {
    console.error('Please create a root element in the template...')
    element = document.createElement('div')
    element.id = id
    document.body.append(element)
  }

  return element
}

function main() {
  const element = ensureRootElement(ROOT_ELEMENT_ID)

  const root = createRoot(element)

  root.render(<App />)
}

main()
