<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'

  let { ...restProps }: HTMLAttributes<HTMLElement> = $props()
</script>

<hr {...restProps} />
