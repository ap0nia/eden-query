<script lang="ts">
  import { eden } from '$lib/eden'

  const hello = eden.api.index.get.createQuery({})

  const bye = eden.api.bye.get.createQuery({})
</script>

<main>
  <p>Because two queries are launched concurrently, the request is actually made to a /batch endpoint.</p>

  {#if $bye.isLoading}
    <h1>loading...</h1>
  {:else if $bye.isError}
    <h1>Hello Error: {$bye.error.message}</h1>
  {:else}
    <h1>
      <span>Bye Query: </span>
      <span>{$bye.data}</span>
    </h1>
  {/if}

  {#if $hello.isLoading}
    <h1>loading...</h1>
  {:else if $hello.isError}
    <h1>Error: {$hello.error.message}</h1>
  {:else}
    <h1>
      <span>Hello Query: </span>
      <span>{$hello.data}</span>
    </h1>
  {/if}
</main>
