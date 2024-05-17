<script lang="ts">
  import '../app.css'

  import { QueryClientProvider, hydrate } from '@tanstack/svelte-query'

  import { eden } from '$lib/eden'

  import type { LayoutData } from './$types'

  export let data: LayoutData

  eden.setContext(data.queryClient)

  $: hydrate(data.queryClient, data.dehydrated)
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
      <li>
        <a href="/abort-on-unmount">abortOnUnmount</a>
      </li>
    </ul>
  </header>
  <slot />
</QueryClientProvider>
