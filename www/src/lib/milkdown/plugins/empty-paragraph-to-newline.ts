import { editorViewCtx } from '@milkdown/kit/core'
import type { Ctx, MilkdownPlugin } from '@milkdown/kit/ctx'
import { paragraphSchema, remarkPreserveEmptyLinePlugin } from '@milkdown/kit/preset/commonmark'
import { Fragment, type Node } from '@milkdown/kit/prose/model'
import type { SerializerState } from '@milkdown/kit/transformer'
import type { NodeSerializerSpec } from '@milkdown/kit/transformer'

import type { remarkWysiwyg as _remarkWysiwyg } from '$lib/unified/remark-wysiwyg'

/**
 * WARNING: Do not unconditionally apply this to editor instances!
 *
 * It overrides the paragraph node schema directly.
 *
 * Basic idea for handling <br /> and newlines below.
 *
 * Editing within Prosemirror -> output newlines as <br /> -> transform to \n and store in database.
 * Get stored content -> convert every consecutive \n to <br /> -> pass pre-processed value to Prosemirror.
 *
 * @see {_remarkWysiwyg} for pre-processing implementation.
 *
 * It is trivial to post-process the content manually.
 * For fully streamlined process, have the Milkdown editor post-process <br /> to \n.
 */
export const emptyParagraphToNewline: MilkdownPlugin = (ctx) => {
  return async () => {
    // await ctx.wait(SchemaReady)

    const paragraphToMarkdown: NodeSerializerSpec = {
      match: (node) => node.type.name === 'paragraph',
      runner: (state, node) => {
        const view = ctx.get(editorViewCtx)

        const lastNode = view.state?.doc.lastChild

        state.openNode('paragraph')

        if (
          (!node.content || node.content.size === 0) &&
          node !== lastNode &&
          shouldPreserveEmptyLine(ctx)
        ) {
          // Do not convert empty paragraph to <br /> element.
          // state.addNode('html', undefined, '<br />')

          // Convert to text "\n" like a hard break.
          // @see https://github.com/Milkdown/milkdown/blob/749dcb30301883b08fa450d36471df932086a136/packages/plugins/preset-commonmark/src/node/hardbreak.ts#L59
          state.addNode('text', undefined, '\n')
        } else {
          serializeText(state, node)
        }

        state.closeNode()
      },
    }

    // @ts-expect-error Override.
    paragraphSchema.node.schema.toMarkdown = paragraphToMarkdown
  }
}

export function shouldPreserveEmptyLine(ctx: Ctx) {
  let shouldPreserveEmptyLine = false

  try {
    ctx.get(remarkPreserveEmptyLinePlugin.id)
    shouldPreserveEmptyLine = true
  } catch {
    shouldPreserveEmptyLine = false
  }
  return shouldPreserveEmptyLine
}

export function serializeText(state: SerializerState, node: Node) {
  const lastIsHardBreak = node.childCount >= 1 && node.lastChild?.type.name === 'hardbreak'

  if (!lastIsHardBreak) {
    state.next(node.content)

    return
  }

  const contentArr: Node[] = []

  node.content.forEach((n, _, i) => {
    if (i === node.childCount - 1) return

    contentArr.push(n)
  })

  state.next(Fragment.fromArray(contentArr))
}
