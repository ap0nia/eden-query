<script lang="ts">
  import { eden } from '$lib/eden'

  const hello = eden.api.index.get.createQuery({})
</script>

<main>
  <h1>Preload</h1>

  <div>
    {#if $hello.isLoading}
      <p>loading...</p>
    {:else if $hello.isError}
      <p>Error: {$hello.error.message}</p>
    {:else}
      <p>
        <b>Data: </b>
        <span>{$hello.data}</span>
      </p>
    {/if}
  </div>

  <p>Since this page's query has been preloaded, a "loading" message should never be seen.</p>
</main>
