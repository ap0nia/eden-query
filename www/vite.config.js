// @ts-check

import { defaultClientConditions, defineConfig } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'

import { paraglideVitePlugin } from '@inlang/paraglide-js'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwind from '@tailwindcss/vite'

const config = defineConfig({
  resolve: {
    conditions: [...defaultClientConditions, 'worker'],
  },
  plugins: [
    devtoolsJson(),

    tailwind(),

    sveltekit(),

    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide',
      strategy: ['url', 'baseLocale'],
    }),
  ],
})

export default config
