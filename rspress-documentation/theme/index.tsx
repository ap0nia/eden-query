import { components } from '@ap0nia/rspress-plugin-twoslash/theme'
import Theme from 'rspress/theme'

function Layout() {
  return <Theme.Layout components={components} />
}

export default {
  ...Theme,
  Layout,
}

export * from 'rspress/theme'
