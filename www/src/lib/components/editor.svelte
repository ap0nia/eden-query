<script lang="ts">
  import '@milkdown/kit/prose/view/style/prosemirror.css'

  import { Editor } from '@milkdown/kit/core'
  import { getMarkdown } from '@milkdown/kit/utils'
  import { IsPromise } from '@sinclair/typebox/value'

  import { milkdown, type MilkdownParams } from '$lib/attachments/milkdown.svelte'
  import { cn } from '$lib/utils/cn'

  interface $$Props extends MilkdownParams {
    /**
     * Callback function that can be invoked by the prosemirror editor,
     * e.g. upon pressing "Enter" to submit a message.
     *
     * The result of this callback will as the result of {@link _EditorProps['handleKeyDown']}
     * __if it is synchronous__ if {@link onSubmit} is not overridden.
     *
     * Therefore, if the intent is to prevent other event handlers from handling "Enter,"
     * such as adding a new paragraph, then ensure the function synchronously returns true.
     */
    onMessage?: (content: string) => unknown

    /**
     */
    // onAction?: (action?: ChannelAction) => unknown

    /**
     */
    canSubmit?: boolean

    /**
     */
    placeholder?: string
  }

  let { onMessage, onSubmit = defaultOnSubmit, canSubmit, placeholder, ...rest }: $$Props = $props()

  let editor = $derived(rest.editor || new Editor())

  let stacked = $state(true)

  /**
   */
  function defaultOnSubmit() {
    if (!onMessage) return false

    const markdown = editor.action(getMarkdown())

    const content = markdown
      .trimEnd()

      // Hardline breaks are denoted with <br />\n\n
      // Replace them with a single \n and make sure that they are re-added
      // before parsing as a markdown string.
      .replace(/<br \/>\n/g, '')

    const result = onMessage(content)

    return Boolean(!IsPromise(result) && result)
  }

  $effect(() => {
    if (editor === rest.editor) return

    return () => {
      editor.destroy()
    }
  })
</script>

{#snippet editorArea()}
  <div class="peer max-h-fit w-full" {@attach milkdown({ editor, onSubmit, ...rest })}></div>

  <span
    class={cn(
      'absolute top-1 left-2',
      'hidden',
      'peer-has-[[contenteditable]_p:only-child_br:only-child]:inline',
      'peer-not-has-[[contenteditable]]:inline',
      'text-base-content/60',
    )}
  >
    {placeholder}
  </span>
{/snippet}

<div class="border-divider mx-auto w-full max-w-3xl overflow-auto rounded border p-2">
  <div class="group/editor max-h-full {stacked ? 'flex flex-col' : 'contents'} space-y-1">
    {#if stacked}
      <div class="relative min-h-8 overflow-y-auto px-2">
        {@render editorArea()}
      </div>
    {/if}

    <div class="flex max-h-full justify-between gap-1">
      <ul class="flex gap-1 self-end">
        <li data-tip="More" class="tooltip">
          <button class="btn btn-ghost btn-circle btn-sm" aria-label="More">
            <span class="icon-[mdi--plus] size-6"></span>
          </button>
        </li>
      </ul>

      {#if !stacked}
        <div class="relative grow overflow-y-auto">
          {@render editorArea()}
        </div>
      {/if}

      <ul class="flex gap-1 self-end">
        <li data-tip="Stacked" class="tooltip">
          <label
            class="btn btn-ghost btn-square btn-sm has-checked:btn-active"
            aria-label="Stacked"
          >
            <input type="checkbox" class="hidden" bind:checked={stacked} />
            <span class="icon-[mdi--gradient-vertical] size-6"></span>
          </label>
        </li>

        <li
          class={cn(
            'swap',
            !canSubmit && 'group-not-has-[[contenteditable]]/editor:swap-active',
            !canSubmit &&
              'group-has-[[contenteditable]_p:only-child_br:only-child]/editor:swap-active',
          )}
        >
          <button
            type="button"
            class={cn(
              'flex cursor-pointer items-center',
              'swap-on',
              'transition-[opacity,scale] duration-300',
              'hover:text-primary hover:scale-110 hover:ease-[cubic-bezier(.5,-2,.5,2)]',
            )}
            aria-label="Record message"
          >
            <span class="icon-[mdi--microphone] size-6"></span>
          </button>

          <button
            onclick={onSubmit}
            type="button"
            class={cn(
              'flex cursor-pointer items-center',
              'swap-off',
              'transition-[opacity,translate] duration-300',
              'hover:text-primary hover:translate-x-0.5 hover:ease-[cubic-bezier(.5,-2,.5,2)]',
            )}
            aria-label="Submit message"
          >
            <span class="icon-[mdi--send] size-6"></span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</div>
