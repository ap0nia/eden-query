<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'

  import { cn } from '$lib/utils/cn'

  let { children, class: className, ...restProps }: HTMLAttributes<HTMLParagraphElement> = $props()
</script>

<p {...restProps} class={cn('leading-[1.65rem] [&:not(:first-child)]:mt-6', className)}>
  {@render children?.()}
</p>
