<script lang="ts">
  import { eden, type InferInput } from '$lib/eden'
  import { keepPreviousData } from '@tanstack/svelte-query'
  import { writable } from 'svelte/store'

  const input = writable<InferInput['api']['names']['get']>({ query: {} })

  const names = eden.api.names.get.createQuery(input, {
    /**
     * This prevents the data from disappearing briefly when loading up the next query.
     */
    placeholderData: keepPreviousData,
  })
</script>

<main>
  <h1>Reactive Input</h1>

  <p>Matching Names</p>

  <p>The developer can optimize this reactive input by using debounce...</p>

  <ul>
    {#each $names.data ?? [] as name}
      <li>{name}</li>
    {/each}
  </ul>

  <label>
    <p>Search for a name by typing into the box</p>
    <input type="text" bind:value={$input.query.search} placeholder="Enter name here..." />
  </label>
</main>
