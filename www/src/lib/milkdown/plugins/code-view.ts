import { codeBlockSchema } from '@milkdown/kit/preset/commonmark'
import { $view } from '@milkdown/kit/utils'

import CodeView from '$lib/milkdown/plugins/code-view.svelte'
import { nodeViewFactory } from '$lib/milkdown/plugins/node-view-factory'

export const codeView = $view(codeBlockSchema.node, (ctx) => {
  const factory = ctx.get(nodeViewFactory.key)

  const nodeViewConstructor = factory({
    component: CodeView,
  })

  return nodeViewConstructor
})
