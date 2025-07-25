import { editorViewCtx } from '@milkdown/kit/core'
import type { Ctx } from '@milkdown/kit/ctx'

/**
 * Focuses the prosemirror input.
 */
export function focus(ctx: Ctx) {
  const view = ctx.get(editorViewCtx)
  view.dom.focus()
}
