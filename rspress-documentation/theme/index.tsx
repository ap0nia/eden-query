import { components } from '@ap0nia/rspress-plugin-twoslash/theme'
import Theme from 'rspress/theme'

import { Ray } from '../src/components/ray'
import { Nav } from './Nav'

export * from 'rspress/theme'

export function Layout() {
  return (
    <Theme.Layout
      beforeDoc={
        <Ray
          className="h-[220px] top-0 left-0 opacity-25 dark:opacity-[.55] pointer-events-none"
          isStatic
        />
      }
      components={components}
    />
  )
}

export { Nav }

export default {
  ...Theme,
  Layout,
  Nav,
}
