// @ts-check

import { rendererRich } from '@shikijs/twoslash'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { defaultHandlers, toHast } from 'mdast-util-to-hast'

import { MDSX_FLOATING_COMPONENT_NAME } from './constants'

/**
 * @type keyof import('./floating-components')
 */
export const MDSX_FLOATING_PARENT = 'Menu'

export const MDSX_FLOATING_MENU_COMPONENT_NAME = `${MDSX_FLOATING_COMPONENT_NAME}.${MDSX_FLOATING_PARENT}`

/**
 * @see https://github.com/shikijs/shiki/blob/93246cdbd1b9f0c170f4e5db551f11ced03bdfce/packages/vitepress-twoslash/src/renderer-floating-vue.ts#L29
 *
 * @param {any} [options={}]
 */
export function rendererFloatingReact(options = {}) {
  const { errorRendering = 'line' } = options

  const {
    classCopyIgnore = 'vp-copy-ignore',
    classFloatingPanel = 'twoslash-floating',
    classCode = 'rspress-code-content',
    classMarkdown = 'rspress-doc',
    floatingVueTheme = 'twoslash',
    floatingVueThemeQuery = 'twoslash-query',
    floatingVueThemeCompletion = 'twoslash-completion',
  } = options.floatingVue || {}

  const hoverBasicProps = {
    class: 'twoslash-hover',
    'popper-class': ['shiki', classFloatingPanel, classCopyIgnore, classCode].join(' '),
    theme: floatingVueTheme,
  }

  return rendererRich({
    classExtra: classCopyIgnore,
    ...options,
    renderMarkdown,
    renderMarkdownInline,
    hast: {
      hoverToken: {
        tagName: MDSX_FLOATING_MENU_COMPONENT_NAME,
        properties: hoverBasicProps,
      },
      hoverCompose: compose,
      queryToken: {
        tagName: MDSX_FLOATING_MENU_COMPONENT_NAME,
        properties: {
          ...hoverBasicProps,
          shown: 'true',
          theme: floatingVueThemeQuery,
        },
      },
      queryCompose: compose,
      popupDocs: {
        class: `twoslash-popup-docs ${classMarkdown}`,
      },
      popupDocsTags: {
        class: `twoslash-popup-docs twoslash-popup-docs-tags ${classMarkdown}`,
      },
      popupError: {
        class: `twoslash-popup-error ${classMarkdown}`,
      },
      errorToken:
        errorRendering === 'line'
          ? undefined
          : {
              tagName: MDSX_FLOATING_MENU_COMPONENT_NAME,
              properties: {
                ...hoverBasicProps,
                class: 'twoslash-error twoslash-error-hover',
              },
            },
      errorCompose: compose,
      completionCompose({ popup, cursor }) {
        return [
          {
            type: 'element',
            tagName: MDSX_FLOATING_MENU_COMPONENT_NAME,
            properties: {
              'popper-class': ['shiki twoslash-completion', classCopyIgnore, classFloatingPanel],
              theme: floatingVueThemeCompletion,
              shown: 'true',
            },
            children: [cursor, popup],
          },
        ]
      },
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
  return [
    {
      type: 'element',
      tagName: 'span',
      properties: {},
      children: [parts.token],
    },
    {
      type: 'element',
      tagName: 'span',
      properties: {},
      children: [parts.popup],
    },
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

        return /** @type any */ (root)
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
