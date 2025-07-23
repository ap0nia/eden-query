<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'

  import { cn } from '$lib/utils/cn'

  let { class: className, children, ...restProps }: HTMLAttributes<HTMLHeadingElement> = $props()
</script>

<h1 class={cn('font-heading mt-2 scroll-m-20 text-4xl font-bold', className)} {...restProps}>
  {@render children?.()}
</h1>
