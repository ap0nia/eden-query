<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query'

  import { browser } from '$app/environment'
  import { eden } from '$lib/eden'

  import type { LayoutData } from './$types'

  export let data: LayoutData

  $: if (browser) {
    eden.setContext(data.queryClient)
  }
</script>

<QueryClientProvider client={data.queryClient}>
  <slot />
</QueryClientProvider>
