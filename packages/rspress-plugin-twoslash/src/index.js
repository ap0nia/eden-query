// @ts-check

import path from 'node:path'

import shikiRehype from '@shikijs/rehype'
import { createTransformerFactory } from '@shikijs/twoslash'
import rehypeStringify from 'rehype-stringify'
import { removeTwoslashNotations } from 'twoslash'

import { rendererFloatingReact } from './renderer-floating-react'
import createTwoslasher from './twoslash'
import { rehypeFloatingImports } from './unified/rehype'

/**
 * @type import('.').rspressPluginTwoslash
 *
 * @see https://github.com/shikijs/shiki/blob/1da0bc8a12ae2d80f7704aaa3a7246b7c00c9321/packages/vitepress-twoslash/src/index.ts#L18
 */
export function rspressPluginTwoslash(options = {}) {
  const { explicitTrigger = true, typesCache } = options

  /**
   * @param {*} error
   * @param {*} code
   * @returns void
   */
  const onError = (error, code) => {
    const isCI = typeof process !== 'undefined' && process?.env?.['CI']
    const isDev = typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development'
    const shouldThrow = (options.throws || isCI || !isDev) && options.throws !== false
    console.error(
      `\n\n--------\nTwoslash error in code:\n--------\n${code.split(/\n/g).slice(0, 15).join('\n').trim()}\n--------\n`,
    )
    if (shouldThrow) throw error
    else console.error(error)
    removeTwoslashNotations(code)
  }

  const defaultTwoslasher = createTwoslasher(options.twoslashOptions)

  let twoslasher = defaultTwoslasher

  // Wrap twoslasher with cache when `resultCache` is provided
  if (typesCache) {
    twoslasher = /** @type typeof twoslasher */ (
      (code, extension, options) => {
        const cached = typesCache.read(code) // Restore cache
        if (cached) return cached
        const twoslashResult = defaultTwoslasher(code, extension, options)
        typesCache.write(code, twoslashResult)
        return twoslashResult
      }
    )

    twoslasher.getCacheMap = defaultTwoslasher.getCacheMap
  }

  const twoslashFactory = createTransformerFactory(twoslasher)

  const twoslash = twoslashFactory({
    langs: ['ts', 'tsx', 'js', 'jsx', 'json', 'vue', 'svelte'],
    renderer: rendererFloatingReact(options),
    onTwoslashError: onError,
    onShikiError: onError,
    ...options,
    explicitTrigger,
  })

  /**
   * @type import('@shikijs/rehype').RehypeShikiOptions['transformers']
   */
  const transformers = [
    {
      /**
       * Temporary monkey patch while rspress completely overrides classNames.
       */
      pre(node) {
        const codeElementChild = node.children[0]

        if (codeElementChild?.type === 'element') {
          this.addClassToHast(codeElementChild, 'twoslash lsp')
        }
      },
    },
    twoslash,
  ]

  typesCache?.init?.()

  /**
   * @type import('unified').PluggableList
   */
  const rehypePlugins = [
    [
      /** @type any */ (shikiRehype),
      {
        addLanguageClass: true,
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
        defaultColor: false,
        transformers,
      },
    ],
    rehypeFloatingImports,
    [/** @type any */ (rehypeStringify), { allowDangerousHtml: true }],
  ]

  /**
   * @type import('@rspress/shared').RspressPlugin
   */
  const plugin = {
    name: 'rspress-plugin-twoslash',
    config(config) {
      config.globalUIComponents ??= []
      config.globalUIComponents.push(path.join(__dirname, 'floating-components', 'initialize'))

      config.markdown ??= {}
      config.markdown.codeHighlighter = 'shiki'
      config.markdown.mdxRs = false

      config.markdown.rehypePlugins ??= []
      config.markdown.rehypePlugins.push(...rehypePlugins)

      return config
    },
  }

  return plugin
}
