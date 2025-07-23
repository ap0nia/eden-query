import type { Code, Node } from 'mdast'
import type { Transformer } from 'unified'
import { visit } from 'unist-util-visit'

export function remarkCodeMeta(): Transformer<Node, Node> {
  return (tree, file) => {
    visit(
      tree,
      (node) => node.type === 'code',
      (node, _index, _parent) => {
        const code = node as Code

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
