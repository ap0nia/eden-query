<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query'

  import type { LayoutData } from './$types'

  export let data: LayoutData
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
