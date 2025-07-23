<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'

  import { cn } from '$lib/utils/cn'

  let { class: className, children, ...restProps }: HTMLAttributes<HTMLHeadingElement> = $props()
</script>

<h4
  class={cn('font-heading mt-8 scroll-m-20 text-lg font-semibold tracking-tight', className)}
  {...restProps}
>
  {@render children?.()}
</h4>
