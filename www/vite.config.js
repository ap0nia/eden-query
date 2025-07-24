// @ts-check

import { defineConfig } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import { groupIconVitePlugin } from 'vitepress-plugin-group-icons'

import { paraglideVitePlugin } from '@inlang/paraglide-js'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwind from '@tailwindcss/vite'

/**
 */
const decodeNamedCharacterReference = `\
 import {characterEntities} from 'character-entities'

 const own = {}.hasOwnProperty

 export function decodeNamedCharacterReference(value) {
   return own.call(characterEntities, value) ? characterEntities[value] : false
 }`

/**
 * @type {import ('vite').PluginOption}
 *
 * @see https://github.com/wooorm/parse-entities/issues/19
 *
 * Basically, whenever this file is requested, return the non-browser version.
 */
const overrideDecodeNamedCharacterReference = {
  name: 'override-decode-named-character-reference',
  load(id) {
    if (!id.includes('decode-named-character-reference')) return
    return decodeNamedCharacterReference
  },
}

const config = defineConfig({
  optimizeDeps: {
    exclude: ['decode-named-character-reference'],
  },
  worker: {
    /**
     * @see https://github.com/vitejs/vite/issues/18585#issuecomment-2459681237
     */
    format: 'es',

    plugins: () => [overrideDecodeNamedCharacterReference],
  },
  plugins: [
    overrideDecodeNamedCharacterReference,

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
