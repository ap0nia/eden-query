import { defaultValueCtx, Editor, editorViewOptionsCtx, rootCtx } from '@milkdown/kit/core'
import type { MilkdownPlugin } from '@milkdown/kit/ctx'
import { clipboard } from '@milkdown/kit/plugin/clipboard'
import { codeBlockSchema, commonmark, listItemSchema } from '@milkdown/kit/preset/commonmark'
import { gfm } from '@milkdown/kit/preset/gfm'
import { Plugin } from '@milkdown/kit/prose/state'
import type { EditorProps, EditorView } from '@milkdown/kit/prose/view'
import { useNodeViewFactory } from '@prosemirror-adapter/svelte'
import { IsPromise } from '@sinclair/typebox/value'
import type { Attachment } from 'svelte/attachments'

import { within } from '$lib/milkdown/actions/within'
import { codeView } from '$lib/milkdown/plugins/code-view'
import { keymap } from '$lib/milkdown/plugins/keymap'
import { nodeViewFactory } from '$lib/milkdown/plugins/node-view-factory'
import { prosemirror, prosemirrorConfig } from '$lib/milkdown/plugins/prosemirror'
import { remarkWysiwyg } from '$lib/milkdown/plugins/remark-wysiwyg'
import { shiki } from '$lib/milkdown/plugins/shiki'
import { cn } from '$lib/utils/cn'

const multilineNodeTypes = [codeBlockSchema.type, listItemSchema.type]

export interface MilkdownParams {
  /**
   * Markdown content to initialize the editor with.
   */
  defaultValue?: string | null

  /**
   * Callback to invoke when "Enter" is pressed at a relevant time.
   *
   * The result of this callback will as the result of {@link EditorProps['handleKeyDown']}
   * __if it is synchronous__.
   *
   * Therefore, if the intent is to prevent other event handlers from handling "Enter,"
   * such as adding a new paragraph, then ensure the function synchronously returns true.
   */
  onSubmit?: () => unknown

  /**
   */
  onUpload?: (files: FileList, view: EditorView, event: ClipboardEvent) => unknown

  /**
   * Editor instance.
   */
  editor?: Editor

  /**
   */
  plugins?: MilkdownPlugin | MilkdownPlugin[]
}

export function milkdown(params?: MilkdownParams): Attachment {
  /**
   * Prosemirror plugins integrated into Milkdown can read from the {@link nodeViewFactory} context
   * to render custom node views.
   */
  const factory = useNodeViewFactory()

  const handleKeyDown: EditorProps['handleKeyDown'] = (_view, event) => {
    if (event.key !== 'Enter') return

    if (event.shiftKey || !event.composed) return

    const isWithinMultilineNode = editor.action(within(multilineNodeTypes))

    if (isWithinMultilineNode) return

    const result = params?.onSubmit?.()

    return Boolean(!IsPromise(result) && result)
  }

  const plugin = new Plugin({
    props: {
      handleKeyDown,
      handleDOMEvents: {
        paste(view, event) {
          if (!params?.onUpload) return false

          const pastedFiles = event.clipboardData?.files

          if (!pastedFiles) return false

          const result = params.onUpload(pastedFiles, view, event)

          return IsPromise(result) ? false : Boolean(result)
        },
      },
    },
  })

  const editor = params?.editor || new Editor()

  editor
    .config((ctx) => {
      ctx.update(editorViewOptionsCtx, (previous) => {
        const previousAttributes = previous.attributes

        previous.attributes = (state) => {
          const attributes =
            typeof previousAttributes === 'function'
              ? previousAttributes(state)
              : previousAttributes

          return {
            ...attributes,

            class: cn(
              // Apply typography prose styles.
              'prose dark:prose-invert',

              // Remove the max width applied by prose.
              'max-w-full',

              // Remove all margins.
              '**:my-0',

              // Give code blocks a thematic background and foreground.
              'prose-pre:bg-base-300 prose-pre:text-base-content',

              'py-1.5',

              // Use minimal line height.
              'leading-tight',

              // Remove default styles for inputs.
              'outline-none',
            ),
          }
        }

        return previous
      })

      const defaultValue = params?.defaultValue || ''

      ctx.inject(defaultValueCtx, defaultValue)

      ctx.inject(nodeViewFactory.key, factory)

      ctx.inject(prosemirrorConfig.key, plugin)
    })
    .use(prosemirror)
    .use(keymap)
    .use(shiki)
    .use(commonmark)
    .use(gfm)
    .use(clipboard)
    .use(remarkWysiwyg)
    .use(codeView)
    .use(params?.plugins ?? [])

  $effect(() => {
    if (params?.editor === editor) return

    return () => {
      editor.destroy()
    }
  })

  return (element) => {
    editor.config((ctx) => ctx.set(rootCtx, element)).create()
  }
}
