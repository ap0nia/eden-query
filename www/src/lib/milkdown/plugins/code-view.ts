import { defaultKeymap } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { defaultHighlightStyle,syntaxHighlighting } from '@codemirror/language'
import type { Line, SelectionRange } from '@codemirror/state'
import {
  drawSelection,
  EditorView as CodeMirror,
  keymap as cmKeymap,
  ViewUpdate,
} from '@codemirror/view'
import { codeBlockSchema } from '@milkdown/kit/preset/commonmark'
import { exitCode } from '@milkdown/kit/prose/commands'
import { redo,undo } from '@milkdown/kit/prose/history'
import { keymap } from '@milkdown/kit/prose/keymap'
import { Node } from '@milkdown/kit/prose/model'
import { type Command,Selection, TextSelection } from '@milkdown/kit/prose/state'
import type { Decoration, DecorationSource, EditorView, NodeView } from '@milkdown/kit/prose/view'
import { $prose, $view } from '@milkdown/kit/utils'

import CodeView from '$lib/milkdown/plugins/code-view.svelte'
import { nodeViewFactory } from '$lib/milkdown/plugins/node-view-factory'

export const svelteCodeView = $view(codeBlockSchema.node, (ctx) => {
  const factory = ctx.get(nodeViewFactory.key)

  const nodeViewConstructor = factory({
    component: CodeView,
  })

  return nodeViewConstructor
})

/**
 * @see https://github.com/ProseMirror/website/blob/a287fec600078bec707fb7708b63cecf4c7bf07f/example/codemirror/index.js
 */
class CodeBlockView implements NodeView {
  /**
   */
  dom: HTMLElement

  /**
   */
  codeMirror: CodeMirror

  /**
   * This flag is used to avoid an update loop between the outer and inner editor.
   */
  updating = false

  get codeMirrorKeymap() {
    const view = this.view

    return [
      { key: 'ArrowUp', run: this.maybeEscape.bind(this, 'line', -1) },
      { key: 'ArrowLeft', run: this.maybeEscape.bind(this, 'char', -1) },
      { key: 'ArrowDown', run: this.maybeEscape.bind(this, 'line', 1) },
      { key: 'ArrowRight', run: this.maybeEscape.bind(this, 'char', 1) },
      {
        key: 'Ctrl-Enter',
        run: () => {
          if (!exitCode(view.state, view.dispatch)) {
            return false
          }

          view.focus()
          return true
        },
      },
      { key: 'Ctrl-z', mac: 'Cmd-z', run: undo.bind(null, view.state, view.dispatch, undefined) },
      {
        key: 'Shift-Ctrl-z',
        mac: 'Shift-Cmd-z',
        run: redo.bind(null, view.state, view.dispatch, undefined),
      },
      { key: 'Ctrl-y', mac: 'Cmd-y', run: redo.bind(null, view.state, view.dispatch, undefined) },
    ]
  }

  constructor(
    public node: Node,
    public view: EditorView,
    public getPos: () => number | undefined,
    public decorations: readonly Decoration[],
    public innerDecorations: DecorationSource,
  ) {
    this.codeMirror = new CodeMirror({
      doc: this.node.textContent,
      extensions: [
        cmKeymap.of([...this.codeMirrorKeymap, ...defaultKeymap]),
        drawSelection(),
        syntaxHighlighting(defaultHighlightStyle),
        javascript(),
        CodeMirror.updateListener.of(this.forwardUpdate),
      ],
    })

    // The editor's outer node is our DOM representation.
    this.dom = this.codeMirror.dom
  }

  forwardUpdate = (update: ViewUpdate) => {
    if (this.updating || !this.codeMirror.hasFocus) {
      return
    }

    const position = this.getPos() || 0

    let offset = position + 1

    const { main } = update.state.selection

    const selectionFrom = offset + main.from

    const selectionTo = offset + main.to

    const previousSelection = this.view.state.selection

    if (
      update.docChanged ||
      previousSelection.from != selectionFrom ||
      previousSelection.to != selectionTo
    ) {
      const tr = this.view.state.tr

      update.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
        if (inserted.length) {
          tr.replaceWith(
            offset + fromA,
            offset + toA,
            this.view.state.schema.text(inserted.toString()),
          )
        } else {
          tr.delete(offset + fromA, offset + toA)
        }

        offset += toB - fromB - (toA - fromA)
      })

      tr.setSelection(TextSelection.create(tr.doc, selectionFrom, selectionTo))

      this.view.dispatch(tr)
    }
  }

  setSelection = (anchor: number, head: number, _root: Document | ShadowRoot) => {
    this.codeMirror.focus()
    this.updating = true
    this.codeMirror.dispatch({ selection: { anchor, head } })
    this.updating = false
  }

  maybeEscape = (unit: 'line' | 'char', dir: 1 | -1) => {
    const { state } = this.codeMirror

    let main: SelectionRange | Line = state.selection.main

    if (!main.empty) {
      return false
    }

    if (unit == 'line') {
      main = state.doc.lineAt(main.head)
    }

    if (dir < 0 ? main.from > 0 : main.to < state.doc.length) {
      return false
    }

    const position = this.getPos() || 0

    const targetPosition = position + (dir < 0 ? 0 : this.node.nodeSize)

    const selection = Selection.near(this.view.state.doc.resolve(targetPosition), dir)

    const tr = this.view.state.tr.setSelection(selection).scrollIntoView()

    this.view.dispatch(tr)

    this.view.focus()

    return false
  }

  update = (node: Node) => {
    if (node.type != this.node.type) {
      return false
    }

    this.node = node

    if (this.updating) {
      return true
    }

    const newText = node.textContent

    const curText = this.codeMirror.state.doc.toString()

    if (newText != curText) {
      let start = 0

      let curEnd = curText.length

      let newEnd = newText.length

      while (start < curEnd && curText.charCodeAt(start) == newText.charCodeAt(start)) {
        ++start
      }

      while (
        curEnd > start &&
        newEnd > start &&
        curText.charCodeAt(curEnd - 1) == newText.charCodeAt(newEnd - 1)
      ) {
        curEnd--
        newEnd--
      }

      this.updating = true

      this.codeMirror.dispatch({
        changes: {
          from: start,
          to: curEnd,
          insert: newText.slice(start, newEnd),
        },
      })

      this.updating = false
    }

    return true
  }

  selectNode = () => {
    this.codeMirror.focus()
  }

  stopEvent() {
    return true
  }
}

function arrowHandler(dir: 'up' | 'down' | 'left' | 'right' | 'forward' | 'backward'): Command {
  return (state, dispatch, view) => {
    if (!state.selection.empty || !view?.endOfTextblock(dir)) {
      return false
    }

    const side = dir == 'left' || dir == 'up' ? -1 : 1

    const $head = state.selection.$head

    const nextPos = Selection.near(state.doc.resolve(side > 0 ? $head.after() : $head.before()), side)

    if (nextPos.$head && nextPos.$head.parent.type.name == 'code_block') {
      dispatch?.(state.tr.setSelection(nextPos))
      return true
    }

    return false
  }
}

const arrowHandlers = keymap({
  ArrowLeft: arrowHandler('left'),
  ArrowRight: arrowHandler('right'),
  ArrowUp: arrowHandler('up'),
  ArrowDown: arrowHandler('down'),
})

export const codeView = [
  $prose(() => arrowHandlers),
  $view(codeBlockSchema.node, () => {
    return (...args) => {
      return new CodeBlockView(...args)
    }
  }),
]
