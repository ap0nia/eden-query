import { $ctx } from '@milkdown/kit/utils'
import type { NodeViewFactory } from '@prosemirror-adapter/svelte'

/**
 * Prosemirror `nodeView` allows custom elements to be used for rendering nodes.
 *
 * Svelte adapter requires a {@link NodeViewFactory} to be initialized at the root component.
 *
 * @see https://prosemirror.net/docs/ref/#view.NodeView
 * @see https://github.com/Saul-Mirone/prosemirror-adapter/tree/main/packages/svelte#play-with-node-view
 */
export const nodeViewFactory = $ctx({} as NodeViewFactory, 'nodeViewFactory')
