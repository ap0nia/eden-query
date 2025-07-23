<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'

  import { cn } from '$lib/utils/cn'

  type $$Props = HTMLAttributes<HTMLElement> & {
    /**
     * The explicit value to copy to the clipboard.
     *
     * Applicable if the value is already known, like IDs.
     */
    value?: string

    /**
     * An HTML element containing the text content to copy.
     *
     * Applicable if the value to copy depends on an element, such as a code block.
     */
    ref?: HTMLElement
  }

  let { class: className, ref, value, ...restProps }: $$Props = $props()

  let copied = $state(false)

  let timeout = $state<ReturnType<typeof setTimeout>>()

  /**
   * Copy either the {@link value} or {@link ref.textContent} to the clipboard.
   */
  async function copy(event: MouseEvent & { currentTarget: EventTarget }) {
    // The navigator API may be unavailable if the domain is insecure.

    if (typeof navigator === 'undefined') return

    const text = value || ref?.textContent

    if (text == null) return

    event.preventDefault()
    event.stopPropagation()

    await navigator.clipboard.writeText(text)

    copied = true

    debouncedResetCopyCode()
  }

  /**
   * Resets the button back to its original state if has been idle for long enough.
   */
  function debouncedResetCopyCode() {
    clearTimeout(timeout)
    timeout = setTimeout(resetCopyCode, 1_000)
  }

  /**
   * Reset the button back to its original state.
   */
  function resetCopyCode() {
    copied = false
  }
</script>

<!--

@component

A button that will copy either the provided value or the text-content of the provided element.

-->

<button
  onclick={copy}
  class={cn(copied && 'swap-active', className, 'btn btn-soft btn-square swap')}
  aria-label="Copy"
  {...restProps}
>
  <span class="icon-[mdi--content-copy] swap-off"></span>
  <span class="icon-[mdi--success-bold] swap-on"></span>
</button>
