<script lang="ts">
  import type { WithElementRef } from 'bits-ui'
  import type { HTMLAttributes } from 'svelte/elements'

  import { cn } from '$lib/utils/cn'

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props()
</script>

<div
  bind:this={ref}
  data-slot="dialog-header"
  class={cn('flex flex-col gap-2 text-center sm:text-left', className)}
  {...restProps}
>
  {@render children?.()}
</div>
