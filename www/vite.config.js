// @ts-check

import { defineConfig } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import { groupIconVitePlugin } from 'vitepress-plugin-group-icons'

import { paraglideVitePlugin } from '@inlang/paraglide-js'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwind from '@tailwindcss/vite'

const config = defineConfig({
  plugins: [
    devtoolsJson(),

    tailwind(),

    sveltekit(),

    groupIconVitePlugin(),

    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide',
      strategy: ['url', 'baseLocale'],
    }),
  ],
})

export default config
