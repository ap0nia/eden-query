import type { MilkdownPlugin } from '@milkdown/kit/ctx'
import { findChildren } from '@milkdown/kit/prose'
import { Node } from '@milkdown/kit/prose/model'
import { Plugin, PluginKey } from '@milkdown/kit/prose/state'
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view'
import { $ctx, $proseAsync } from '@milkdown/kit/utils'
import type { Element, RootContent, Text } from 'hast'
import {
  type BundledHighlighterOptions,
  type BundledLanguage,
  bundledLanguages,
  type BundledTheme,
  type Highlighter,
} from 'shiki'

import { highlighter, type HighlighterEvents } from '$lib/shiki'

export type ShikiConfig = Partial<BundledHighlighterOptions<BundledLanguage, BundledTheme>>

export const shikiConfig = $ctx({} as ShikiConfig, 'shiki-config')

/**
 * Shiki syntax highlighting plugin based on the official Milkdown prism plugin.
 *
 * @see https://github.com/Milkdown/milkdown/blob/6859e892808fc6ca011f4fee80ca7cc620f9ef4c/packages/plugins/plugin-prism/src/index.ts#L31
 */
export const shikiPlugin = $proseAsync(async (_ctx) => {
  const name = 'code_block'

  const languageLoadedEvent = 'languageLoaded' satisfies keyof HighlighterEvents

  return new Plugin({
    key: new PluginKey('MILKDOWN_SHIKI'),
    state: {
      init: (_, { doc }) => {
        return getDecorations(doc, name, highlighter)
      },
      apply: (transaction, decorationSet, oldState, state) => {
        if (transaction.getMeta(languageLoadedEvent)) {
          return getDecorations(transaction.doc, name, highlighter)
        }

        const isNodeName = state.selection.$head.parent.type.name === name

        const isPreviousNodeName = oldState.selection.$head.parent.type.name === name

        const oldNode = findChildren((node) => node.type.name === name)(oldState.doc)

        const newNode = findChildren((node) => node.type.name === name)(state.doc)

        const codeBlockChanged =
          transaction.docChanged &&
          (isNodeName ||
            isPreviousNodeName ||
            oldNode.length !== newNode.length ||
            oldNode[0]?.node.attrs['language'] !== newNode[0]?.node.attrs['language'] ||
            transaction.steps.some((step) => {
              const s = step as unknown as { from: number; to: number }

              return (
                s.from !== undefined &&
                s.to !== undefined &&
                oldNode.some((node) => {
                  return node.pos >= s.from && node.pos + node.node.nodeSize <= s.to
                })
              )
            }))

        if (codeBlockChanged) {
          return getDecorations(transaction.doc, name, highlighter)
        }

        return decorationSet.map(transaction.mapping, transaction.doc)
      },
    },
    props: {
      decorations(this: Plugin, state) {
        return this.getState(state)
      },
    },
    view(view) {
      const unsubscribe = highlighter.on(languageLoadedEvent, () => {
        view.dispatch(view.state.tr.setMeta(languageLoadedEvent, true))
      })

      return {
        destroy() {
          unsubscribe()
        },
      }
    },
  })
})

shikiPlugin.meta = {
  package: '@milkdown/plugin-shiki',
  displayName: 'Prose<shiki>',
}

export function getDecorations(doc: Node, name: string, highlighter: Highlighter) {
  const decorations: Decoration[] = []

  try {
    findChildren((node) => node.type.name === name)(doc).forEach((block) => {
      let from = block.pos + 1

      const { language } = block.node.attrs

      const lang = language in bundledLanguages ? language : undefined

      if (lang) {
        highlighter.loadLanguage(lang)
      }

      const nodes = highlighter.codeToHast(block.node.textContent, {
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
        lang,
        defaultColor: false,
      })

      // code lines contain span nodes with one text children.
      // newlines are represented by a single text node.

      const spanOrTextNodes = flatNodes(nodes.children)

      spanOrTextNodes.forEach((node) => {
        if (node.type === 'text') {
          from += node.value.length
          return
        }

        const textNode = node.children[0] as Text | undefined

        if (textNode == null) return

        const to = from + textNode.value.length

        const decoration = Decoration.inline(from, to, node.properties as any)

        decorations.push(decoration)

        from = to
      })
    })
  } catch (_err) {
    // noop
  }

  return DecorationSet.create(doc, decorations)
}

function flatNodes(nodes: RootContent[]) {
  return nodes.flatMap((node): (Text | Element)[] => {
    if (node.type === 'text') return [node]

    if (node.type !== 'element') return []

    if (node.properties['class']) {
      node.properties['className'] = node.properties['class']
    }

    if (node.tagName === 'span' && !node.properties['class']?.toString().includes('line')) {
      return [node]
    }

    return flatNodes(node.children)
  })
}

export const shiki: MilkdownPlugin[] = [shikiPlugin, shikiConfig].flat()
