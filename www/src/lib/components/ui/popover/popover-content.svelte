<script lang="ts">
  import { Popover as PopoverPrimitive } from 'bits-ui'

  import { cn } from '$lib/utils/cn'

  let {
    ref = $bindable(null),
    class: className,
    sideOffset = 4,
    align = 'center',
    portalProps,
    ...restProps
  }: PopoverPrimitive.ContentProps & {
    portalProps?: PopoverPrimitive.PortalProps
  } = $props()
</script>

<PopoverPrimitive.Portal {...portalProps}>
  <PopoverPrimitive.Content
    bind:ref
    data-slot="popover-content"
    {sideOffset}
    {align}
    class={cn(
      'z-50',
      'w-72',
      'origin-(--bits-popover-content-transform-origin)',
      'rounded-md',
      'border p-4 shadow-md outline-hidden',

      'bg-popover text-popover-foreground',

      'data-[state=open]:animate-in',
      'data-[state=open]:fade-in-0',
      'data-[state=open]:zoom-in-95',

      'data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0',
      'data-[state=closed]:zoom-out-95',

      'data-[side=bottom]:slide-in-from-top-2',
      'data-[side=left]:slide-in-from-right-2',
      'data-[side=right]:slide-in-from-left-2',
      'data-[side=top]:slide-in-from-bottom-2',

      className,
    )}
    {...restProps}
  />
</PopoverPrimitive.Portal>
