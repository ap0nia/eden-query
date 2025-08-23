import { visit } from 'unist-util-visit'

/**
 * @returns {import('unified').Transformer<import('mdast').Node, import('mdast'). Node>}
 */
export function remarkCodeMeta() {
  return (tree, file) => {
    visit(
      tree,
      (node) => node.type === 'code',
      (node, _index, _parent) => {
        const code = /** @type import ('mdast').Code */ (node)

        if (code.lang) {
          code.meta ||= ''
          code.meta += ` lang=${code.lang}`
          code.meta += ` start=${code.position?.start.offset} end=${code.position?.end.offset}`
          code.meta = code.meta.trim()

          file.data.langs ??= new Set()
          file.data['langs'].add(code.lang)
        }
      },
    )
  }
}
