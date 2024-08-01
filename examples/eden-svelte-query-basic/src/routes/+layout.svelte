<script lang="ts">
  import { QueryClientProvider, hydrate } from '@tanstack/svelte-query'

  import { eden } from '$lib/eden'

  import type { LayoutData } from './$types'

  export let data: LayoutData

  $: eden.setContext(data.queryClient)
  $: hydrate(data.queryClient, data.dehydrated)
</script>

<QueryClientProvider client={data.queryClient}>
  <header>
    <nav>
      <ul>
        <li>
          <a href="/">home</a>
        </li>
        <li>
          <a href="/hello-preload">hello with preloading</a>
        </li>
        <li>
          <a href="/hello-ssr">hello with ssr</a>
        </li>
        <li>
          <a href="/batch">batch</a>
        </li>
        <li>
          <a href="/mutation">mutation example with todos</a>
        </li>
        <li>
          <a href="/reactive-input">reactive input box</a>
        </li>
        <li>
          <a href="/abort">abort</a>
        </li>
      </ul>
    </nav>
  </header>
  <slot />
</QueryClientProvider>
