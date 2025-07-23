<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'

  import { cn } from '$lib/utils/cn'

  let { class: className, children, ...restProps }: HTMLAttributes<HTMLHeadingElement> = $props()
</script>

<h2
  class={cn(
    'font-heading mt-16 scroll-m-20 text-xl font-semibold tracking-tight first:mt-0',
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</h2>
