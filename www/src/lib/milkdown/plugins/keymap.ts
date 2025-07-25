import { commandsCtx } from '@milkdown/kit/core'
import type { MilkdownPlugin } from '@milkdown/kit/ctx'
import { $command, $useKeymap } from '@milkdown/kit/utils'

/**
 * Custom keymaps.
 */
export const customKeymap = $useKeymap('custom-commands', {
  shiftEnterToRegularEnter: {
    shortcuts: 'Shift-Enter',
    command: (ctx) => {
      const commands = ctx.get(commandsCtx)
      return () => commands.call(shiftEnterToRegularEnterCommand.key)
    },
  },
})

export const shiftEnterToRegularEnterCommand = $command('shift-enter-to-regular-enter', (_ctx) => {
  return () => (_state, _dispatch, view) => {
    if (view == null) return false

    /**
     * Create a new keyboard event that replaces the "Shift-Enter" with just regular "Enter",
     * then allow it to be handled by any existing handlers.
     */
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13, // 'Enter' key code
      bubbles: true,
      cancelable: true,
    })

    view.dom.dispatchEvent(enterEvent)

    return true
  }
})

export const keymap: MilkdownPlugin[] = [customKeymap, shiftEnterToRegularEnterCommand].flat()
