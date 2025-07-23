<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'

  import { cn } from '$lib/utils/cn'

  let { class: className, children, ...restProps }: HTMLAttributes<HTMLUListElement> = $props()
</script>

<ul class={cn('my-4 ml-6 list-disc pl-0', className)} {...restProps}>
  {@render children?.()}
</ul>
