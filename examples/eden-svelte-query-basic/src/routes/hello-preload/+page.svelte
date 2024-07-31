<script lang="ts">
  import { eden } from '$lib/eden'

  const hello = eden.api.index.get.createQuery({})
</script>

<main>
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
    Since this page's query has been preloaded, a "loading" message should never be seen.
  </p>
</main>
