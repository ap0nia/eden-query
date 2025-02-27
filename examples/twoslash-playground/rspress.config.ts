import * as path from 'node:path'

import { defineConfig } from 'rspress/config'
import { ModuleResolutionKind } from 'typescript'

import { rspressPluginTwoslash } from '@ap0nia/rspress-plugin-twoslash'
import { createFileSystemTypesCache } from '@ap0nia/rspress-plugin-twoslash/cache-fs'

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'My Site',
  icon: '/rspress-icon.png',
  globalStyles: path.join(__dirname, 'styles/index.css'),
  outDir: 'build',
  plugins: [
    rspressPluginTwoslash({
      typesCache: createFileSystemTypesCache({ dir: '.twoslash' }),
      twoslashOptions: {
        compilerOptions: {
          moduleResolution: ModuleResolutionKind.Bundler,
        },
        customTags: ['annotate', 'log', 'warn', 'error'],
      },
    }),
  ],
  logo: {
    light: '/rspress-light-logo.png',
    dark: '/rspress-dark-logo.png',
  },
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/web-infra-dev/rspress',
      },
    ],
  },
})
