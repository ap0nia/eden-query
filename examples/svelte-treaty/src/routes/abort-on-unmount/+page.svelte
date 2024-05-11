<script lang="ts">
  import FetchingComponent from './fetching-component.svelte'

  let show = false

  function toggleChild() {
    show = !show
  }
</script>

<main>
  <div>
    <h1>Child Component with long request</h1>
    <p>Double click on the button and it should abort the fetch request</p>
    <button on:click={toggleChild}>Toggle child</button>
  </div>

  <div>
    {#if show}
      <FetchingComponent />
    {/if}
  </div>
</main>
