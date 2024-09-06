<script lang="ts">
  import { eden, type InferInput } from '$lib/eden'
  import { keepPreviousData } from '@tanstack/svelte-query'
  import { writable } from 'svelte/store'

  const input = writable<InferInput['api']['names']['get']['query']>({})

  const id = writable({ id: 1 })

  const names = eden.api.todos(id).get.createQuery(input, { placeholderData: keepPreviousData })
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
    <input type="text" bind:value={$input.search} placeholder="Enter name here..." />
    <input type="number" bind:value={$id.id} placeholder="Enter ID" />
  </label>
</main>
