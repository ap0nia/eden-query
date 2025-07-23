import rehypeShikiFromHighlighter from '@shikijs/rehype/core'
import {
  transformerCompactLineOptions,
  transformerMetaHighlight,
  transformerMetaWordHighlight,
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
  // transformerRemoveLineBreak,
  transformerRemoveNotationEscape,
  transformerRenderWhitespace,
  // transformerStyleToClass,
} from '@shikijs/transformers'
import type { ShikiTransformer } from 'shiki'

import { rendererFloatingSvelte } from '$lib/mdsx/floating-renderer-svelte'
import { highlighter } from '$lib/shiki'
import { transformerTwoslashFactory } from '$lib/twoslash'
import { parseMetaString } from '$lib/unified/parse-meta'

const transformerTwoslash = transformerTwoslashFactory({
  renderer: rendererFloatingSvelte(),
  explicitTrigger: true,
})

export const transformers = [
  {
    name: 'vitepress:add-class',
    pre(hast) {
      hast.properties['lang'] = this.options.lang
      hast.properties['meta'] = this.options.meta?.__raw

      const title = this.options.meta?.['title'] || this.options.lang

      // The value to be visible on the rendered markdown somewhere so it loads the icon.
      hast.properties['vitepress-plugin-group-icons'] = `data-title="${title}"`

      if (this.options.meta?.['__src__']) {
        hast.properties['data-src'] = this.options.meta?.['__src__']
      }

      if (this.options.meta?.['__style__']) {
        hast.properties['data-style'] = this.options.meta?.['__style__']
      }

      this.addClassToHast(hast, 'vp-code')

      if (this.options.lang) {
        this.addClassToHast(hast, `language-${this.options.lang}`)
      }
    },
    code(hast) {
      hast.properties['lang'] = this.options.lang
      hast.properties['meta'] = this.options.meta?.__raw

      hast.properties['data-line-numbers'] = ''

      const lines = hast.children.filter((child) => child.type === 'element')
      const maxDigits = Math.floor(Math.log10(Math.abs(lines.length))) + 1

      hast.properties['data-line-numbers-max-digits'] = Math.min(maxDigits, 1)
      hast.properties['style'] ||= ''
      hast.properties['style'] += ` --line-numbers-max-digits: ${maxDigits};`.trim()
    },
    span(_hast, _line, _col, lineElement) {
      lineElement.properties['data-line'] = ''
    },
  },
  transformerNotationDiff(),
  transformerNotationHighlight(),
  transformerNotationWordHighlight(),
  transformerNotationFocus({
    classActiveLine: 'has-focus',
    classActivePre: 'has-focused-lines',
  }),
  transformerNotationErrorLevel(),
  transformerRenderWhitespace(),
  transformerMetaHighlight(),
  transformerMetaWordHighlight(),
  transformerCompactLineOptions(),
  // transformerRemoveLineBreak(),
  transformerRemoveNotationEscape(),
  // transformerStyleToClass(),

  transformerTwoslash,
] satisfies ShikiTransformer[]

export const rehypeShiki = rehypeShikiFromHighlighter.bind(null, highlighter, {
  addLanguageClass: true,
  themes: { light: 'github-light', dark: 'github-dark' },
  defaultColor: false,
  parseMetaString,
  transformers,
})
