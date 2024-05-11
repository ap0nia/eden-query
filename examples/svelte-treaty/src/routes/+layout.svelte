<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query'

  import { eden } from '$lib/eden'

  import type { LayoutData } from './$types'

  export let data: LayoutData

  eden.setContext(data.queryClient)
</script>

<QueryClientProvider client={data.queryClient}>
  <header>
    <p>Links</p>
    <ul>
      <li>
        <a href="/">Home</a>
      </li>
      <li>
        <a href="/create-mutation">createMutation</a>
      </li>
    </ul>
  </header>
  <slot />
</QueryClientProvider>
