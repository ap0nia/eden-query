<script lang="ts">
  import { eden } from '$lib/eden'

  const query = eden.api.count.get.createQuery({})

  const mutation = eden.api.count.put.createMutation()

  const utils = eden.getContext()

  async function handleClick() {
    await $mutation.mutateAsync({})

    utils.api.invalidate()
  }
</script>

<main>
  <h1>Count Mutation</h1>

  <div>
    <h2>Current Count</h2>
    <p>{$query.data?.data}</p>
  </div>

  <div>
    <h2>createMutation: Increment Count</h2>
    <button on:click={handleClick}>Mutate</button>
  </div>
</main>
