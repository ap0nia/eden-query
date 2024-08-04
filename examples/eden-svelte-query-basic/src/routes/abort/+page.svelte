<script lang="ts">
  import Sleep from '$lib/sleep.svelte'

  export let show = false

  function toggle() {
    show = !show
  }
</script>

<main>
  <h1>Abort</h1>

  <button on:click|preventDefault={toggle}>Toggle Component</button>

  <p>
    The toggle-able component does a long query. If it's hidden before the request ends, then the
    request should be aborted.
  </p>

  {#if show}
    <Sleep />
  {/if}
</main>
