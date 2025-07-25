import type { MilkdownPlugin } from '@milkdown/kit/ctx'
import type { Plugin } from '@milkdown/kit/prose/state'
import { $ctx, $prose } from '@milkdown/kit/utils'

export const prosemirrorConfig = $ctx({} as Plugin, 'prosemirror-config')

/**
 * Utility for forwarding arbitrary props to a prosemirror plugin.
 */
export const prosemirrorPlugin = $prose((ctx) => {
  const plugin = ctx.get(prosemirrorConfig.key)
  return plugin
})

/**
 */
export const prosemirror: MilkdownPlugin[] = [prosemirrorConfig, prosemirrorPlugin].flat()
