<script lang="ts">
  import { eden } from '$lib/eden'

  const hello = eden.api.index.get.createQuery()

  eden.createQueries(q => {
    return [q.api.index.get()]
  })
</script>

<main>
  <h1>Home</h1>

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
</main>
