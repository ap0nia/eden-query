<script lang="ts">
  import { Dialog as DialogPrimitive, type WithoutChildrenOrChild } from 'bits-ui'
  import type { Snippet } from 'svelte'

  import { cn } from '$lib/utils/cn'

  import * as Dialog from '.'

  let {
    ref = $bindable(null),
    class: className,
    portalProps,
    children,
    showCloseButton = true,
    ...restProps
  }: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
    portalProps?: DialogPrimitive.PortalProps
    children: Snippet
    showCloseButton?: boolean
  } = $props()
</script>

<Dialog.Portal {...portalProps}>
  <Dialog.Overlay />
  <DialogPrimitive.Content
    bind:ref
    data-slot="dialog-content"
    class={cn(
      'bg-base-100',
      // 'bg-background',
      'data-[state=open]:animate-in',
      'data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0',
      'data-[state=open]:fade-in-0',
      'data-[state=closed]:zoom-out-95',
      'data-[state=open]:zoom-in-95',

      'fixed',

      'top-1/2 left-1/2',
      // 'top-[50%] left-[50%]',

      'z-50 grid w-full',

      'max-w-[calc(100%-2rem)]',

      '-translate-x-1/2 -translate-y-1/2',
      // 'translate-x-[-50%] translate-y-[-50%]',

      'gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
      className,
    )}
    {...restProps}
  >
    {@render children?.()}
    {#if showCloseButton}
      <DialogPrimitive.Close
        class={cn(
          'absolute',

          'top-3 right-3',
          // 'top-4 right-4',

          'rounded-xs opacity-70 transition-opacity hover:opacity-100',

          'btn btn-square btn-xs btn-ghost',

          // 'ring-offset-background',

          // 'focus:ring-ring',
          // 'focus:ring-2',
          // 'focus:ring-offset-2',
          // 'focus:outline-hidden',

          'disabled:pointer-events-none',

          '[&_svg]:pointer-events-none',
          '[&_svg]:shrink-0',
          "[&_svg:not([class*='size-'])]:size-4",
        )}
      >
        <span class="icon-[mdi--close]"></span>
        <span class="sr-only">Close</span>
      </DialogPrimitive.Close>
    {/if}
  </DialogPrimitive.Content>
</Dialog.Portal>
