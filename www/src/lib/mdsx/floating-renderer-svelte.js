// @ts-check

import { rendererRich } from '@shikijs/twoslash'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { defaultHandlers, toHast } from 'mdast-util-to-hast'

import { MDSX_FLOATING_COMPONENT_NAME } from './constants.js'

/**
 * type keyof import('./components')
 */
export const MDSX_FLOATING_PARENT = 'root'

export const MDSX_FLOATING_ROOT_COMPONENT_NAME = `${MDSX_FLOATING_COMPONENT_NAME}.${MDSX_FLOATING_PARENT}`

/**
 * @see https://github.com/shikijs/shiki/blob/93246cdbd1b9f0c170f4e5db551f11ced03bdfce/packages/vitepress-twoslash/src/renderer-floating-vue.ts#L29
 * @type import('./floating-renderer-svelte.js').rendererFloatingSvelte
 */
export function rendererFloatingSvelte(options = {}) {
  const {
    classCopyIgnore = 'vp-copy-ignore',
    classFloatingPanel = 'twoslash-floating',
    classCode = 'vp-code',
    // classMarkdown = 'vp-doc',
    floatingSvelteTheme = 'twoslash dropdown',
    // floatingSvelteThemeQuery = 'twoslash-query',
    // floatingSvelteThemeCompletion = 'twoslash-completion',
  } = options.floatingSvelte || {}

  const hoverBasicProps = {
    class: 'twoslash-hover',
    'popper-class': ['shiki', classFloatingPanel, classCopyIgnore, classCode].join(' '),
    theme: floatingSvelteTheme,
  }

  return rendererRich({
    classExtra: classCopyIgnore,
    ...options,
    renderMarkdown,
    renderMarkdownInline,
    hast: {
      hoverToken: {
        tagName: MDSX_FLOATING_ROOT_COMPONENT_NAME,
        properties: hoverBasicProps,
      },
      hoverCompose: compose,
    },
  })
}

/**
 * @param {{
 *   token: import('hast').Element | import('hast').Text,
 *   popup: import('hast').Element
 * }} parts
 * @returns {import('hast').Element[]}
 */
function compose(parts) {
  const snippet = createSnippet('popper', undefined, {
    type: 'element',
    tagName: 'span',
    properties: {},
    children: [parts.popup],
  })

  return [
    {
      type: 'element',
      tagName: 'span',
      properties: {},
      children: [parts.token],
    },
    ...snippet,
  ]
}

/**
 * @this import('shiki').ShikiTransformerContextCommon
 * @param {string} md
 * @returns {import('hast').ElementContent[]}
 */
function renderMarkdown(md) {
  // Replace jsdoc links.
  const value = md.replace(/\{@link ([^}]*)\}/g, '$1')

  /**
   * @type import('mdast-util-from-markdown').Options
   */
  const fromMarkdownOptions = {
    mdastExtensions: [gfmFromMarkdown()],
  }

  const mdast = fromMarkdown(value, fromMarkdownOptions)

  /**
   * @type import('mdast-util-to-hast').Options
   */
  const toHastOptions = {
    handlers: {
      code: (state, node) => {
        /**
         * @type string | undefined
         */
        const lang = node.lang

        if (!lang) {
          return defaultHandlers.code(state, node)
        }

        const structure = node.value.trim().includes('\n') ? 'classic' : 'inline'

        const root = this.codeToHast(node.value, {
          ...this.options,
          transformers: [],
          lang,
          structure,
        })

        const elementContent = /** @type import('hast').Element */ ({
          type: 'element',
          tagName: 'code',
          properties: {},
          children: root.children,
        })

        return elementContent
      },
    },
  }

  const element = /** @type import('hast').Element */ (toHast(mdast, toHastOptions))

  return element.children
}

/**
 * @this import('shiki').ShikiTransformerContextCommon
 * @param {string} md
 * @param {string?} context
 * @returns {import('hast').ElementContent[]}
 */
function renderMarkdownInline(md, context) {
  if (context === 'tag:param') {
    md = md.replace(/^([\w$-]+)/, '`$1` ')
  }

  const children = renderMarkdown.call(this, md)

  if (children.length === 1 && children[0]?.type === 'element' && children[0].tagName === 'p') {
    return children[0].children
  }

  return children
}

/**
 * Creates nodes that can be restructured into a Svelte snippet.
 *
 * @param {string} snippet Name of the snippet.
 * @param {*} props Props to provide to the child. Must be JSON-serializable due to limitations in parsing.
 * @param {import('hast').Element} children
 * @returns {import('hast').Element[]}
 *
 * @example Resulting template.
 *
 * ```html
 * {#snippet child({ a: 123 })}
 *   <a href="/">Link</a>
 * {/snippet}
 * ```
 *
 * The child can have be an element, which will be lowered separately from the raw `snippet` directives.
 */
export function createSnippet(snippet, props, children) {
  /** @type import('hast').Element */
  const openingSnippet = /** @type any */ ({
    type: 'raw',
    value: `{#snippet ${snippet}(${props ? JSON.stringify(props) : ''})}`,
  })

  /** @type import('hast').Element */
  const closingSnippet = /** @type any */ ({
    type: 'raw',
    value: '{/snippet}',
  })

  return [openingSnippet, children, closingSnippet]
}
