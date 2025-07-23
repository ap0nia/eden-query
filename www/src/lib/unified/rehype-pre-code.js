// @ts-check

import { visit } from 'unist-util-visit'

/**
 * Forwards properties from a code element to its parent pre element.
 *
 * @returns {import('unified').Transformer<import('hast').Root, import('hast').Root>}
 */
export function rehypePreCode() {
  return (tree, _file) => {
    visit(tree, (node) => {
      if (node.type !== 'element' || node.tagName !== 'pre') {
        return
      }

      const element = node.children[0]

      if (element?.type !== 'element' || element.tagName !== 'code') {
        return
      }

      node.data = { ...element.data, ...node.data }
    })
  }
}
