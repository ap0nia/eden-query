import { editorViewCtx, parserCtx } from '@milkdown/kit/core'
import type { Ctx } from '@milkdown/kit/ctx'
import { Slice } from '@milkdown/kit/prose/model'

/**
 * Clears the editor.
 */
export function clear(ctx: Ctx) {
  const view = ctx.get(editorViewCtx)

  const parser = ctx.get(parserCtx)

  const doc = parser('')

  if (!doc) return

  const state = view.state

  const slice = new Slice(doc.content, 0, 0)

  const tr = state.tr

  tr.replace(0, state.doc.content.size, slice)

  view.dispatch(tr)
}
