// @ts-check

import path from 'node:path'

import ci from 'ci-info'
import { defineConfig } from 'rspress/config'

import { rspressPluginTwoslash } from '@ap0nia/rspress-plugin-twoslash'

import { repository } from '../package.json'

const repositoryName = repository.url.split('/').pop() ?? ''

const base = ci.GITHUB_ACTIONS ? `/${repositoryName.replace('.git', '')}/` : ''

const config = defineConfig({
  title: 'ElysiaJS',
  base,
  root: 'docs',
  outDir: 'build',
  globalStyles: path.join(__dirname, 'styles/index.css'),
  plugins: [rspressPluginTwoslash()],
  themeConfig: {
    lastUpdated: true,
  },
  markdown: {
    checkDeadLinks: false,
  },
})

export default config
