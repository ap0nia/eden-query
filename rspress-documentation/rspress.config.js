// @ts-check

import path from 'node:path'
import { defineConfig } from 'rspress/config'

import { rspressPluginTwoslash } from '@ap0nia/rspress-plugin-twoslash'

const config = defineConfig({
  root: 'docs',
  outDir: 'build',
  title: 'Eden-Query',
  globalStyles: path.join(__dirname, 'styles/index.css'),
  plugins: [rspressPluginTwoslash()],
})

export default config
