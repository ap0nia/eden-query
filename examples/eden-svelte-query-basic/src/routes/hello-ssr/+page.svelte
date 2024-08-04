<script lang="ts">
  import { eden } from '$lib/eden'

  const hello = eden.api.index.get.createQuery({})
</script>

<main>
  <h1>SSR</h1>

  <div>
    {#if $hello.isLoading}
      <h1>loading...</h1>
    {:else if $hello.isError}
      <h1>Error: {$hello.error.message}</h1>
    {:else}
      <h1>
        {$hello.data}
      </h1>
    {/if}
  </div>

  <p>
    <span>Since this page's query has been preloaded </span>
    <b>using SSR,</b>
    <span>a "loading" message should never be seen.</span>
  </p>
</main>
