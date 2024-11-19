// @ts-check

import path from 'node:path'

import shikiRehype from '@shikijs/rehype'
import { transformerTwoslash } from '@shikijs/twoslash'
import rehypeStringify from 'rehype-stringify'
import { ModuleResolutionKind } from 'typescript'

import { rendererFloatingReact } from './renderer-floating-react'
import createTwoslasher from './twoslash'
import { rehypeFloatingImports } from './unified/rehype'

/**
 * @type import('.').rspressPluginTwoslash
 */
export function rspressPluginTwoslash() {
  /**
   * @type import('@rspress/shared').RspressPlugin
   */
  const plugin = {
    name: 'rspress-plugin-twoslash',
    config(config) {
      config.globalUIComponents ??= []
      config.globalUIComponents.push(path.join(__dirname, 'floating-components', 'initialize'))

      /**
       * @type import('@shikijs/rehype').RehypeShikiOptions['transformers']
       */
      const transformers = [
        {
          pre(node) {
            const codeElementChild = node.children[0]

            if (codeElementChild?.type === 'element') {
              this.addClassToHast(codeElementChild, 'twoslash lsp')
            }
          },
        },
        transformerTwoslash({
          explicitTrigger: true,
          langs: ['ts', 'tsx', 'svelte', 'vue'],
          twoslasher: createTwoslasher(),
          renderer: rendererFloatingReact(),
          twoslashOptions: {
            compilerOptions: {
              moduleResolution: ModuleResolutionKind.Bundler,
            },
          },
        }),
      ]

      config.markdown ??= {}
      config.markdown.codeHighlighter = 'shiki'
      config.markdown.mdxRs = false

      config.markdown.rehypePlugins ??= []

      config.markdown.rehypePlugins.push([
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
      ])

      config.markdown.rehypePlugins.push(rehypeFloatingImports)

      config.markdown.rehypePlugins.push([
        /** @type any */ (rehypeStringify),
        { allowDangerousHtml: true },
      ])

      return config
    },
  }

  return plugin
}
