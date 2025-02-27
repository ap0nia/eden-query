import { components } from '@ap0nia/rspress-plugin-twoslash/theme'
import { usePageData } from 'rspress/runtime'
import Theme from 'rspress/theme'

import { Ray } from '../src/components/ray'
import { Nav } from './Nav'

export * from 'rspress/theme'

export function Layout() {
  const { page } = usePageData()

  const frontmatter = page.frontmatter

  return (
    <Theme.Layout
      beforeDoc={
        frontmatter['ray'] !== false && (
          <Ray
            className="pointer-events-none left-0 top-0 h-[220px] opacity-25 dark:opacity-[.55]"
            isStatic
          />
        )
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
