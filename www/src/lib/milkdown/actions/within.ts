import { editorStateCtx } from '@milkdown/kit/core'
import type { Ctx } from '@milkdown/kit/ctx'
import { findParentNodeClosestToPos } from '@milkdown/kit/prose'
import type { NodeType } from '@milkdown/kit/prose/model'

export type TypeGetter = (ctx: Ctx) => NodeType

/**
 * Whether the editor selection is currently within a specified node.
 */
export function within(typeOrTypes: TypeGetter | TypeGetter[]) {
  const types = Array.isArray(typeOrTypes) ? typeOrTypes : [typeOrTypes]

  return (ctx: Ctx): boolean => {
    const state = ctx.get(editorStateCtx)

    const nodeTypes = types.map((type) => type(ctx))

    const findNode = findParentNodeClosestToPos((node) => nodeTypes.includes(node.type))

    const node = findNode(state.selection.$anchor)

    return node != null
  }
}
