<script lang="ts">
  import { eden } from '$lib/eden'

  const utils = eden.getContext()

  const query = eden.api.count.get.createQuery({})

  const syncIncrementMutation = eden.api.count.put.createMutation({
    onSuccess: () => {
      utils.api.count.get.invalidate()
    },
  })

  const asyncIncrementMutation = eden.api.count.put.createMutation()

  const asyncResetMutation = eden.api.count.delete.createMutation({
    onSuccess: () => {
      utils.api.count.get.invalidate()
    },
  })

  function handleSyncClick() {
    $syncIncrementMutation.mutate({})
  }

  async function handleAsyncClick() {
    await $asyncIncrementMutation.mutateAsync({})
    utils.api.count.get.invalidate()
  }

  async function handleReset() {
    await $asyncResetMutation.mutateAsync({})
  }
</script>

<main>
  <h1 id="title">Count Mutation</h1>

  <div>
    <h2>Current Count: {$query.data}</h2>
    <p>
      This is the current count and gets invalidated after the count mutation. Try out the different
      mutation options below.
    </p>
  </div>

  <div>
    <h2>Mutations</h2>

    <div>
      <p>Increment</p>
      <button on:click={handleSyncClick}>Synchronous increment with onSuccess invalidation</button>
      <button on:click={handleAsyncClick}>Asynchronous increment with await invalidation</button>
    </div>
    <div>

      <p>Reset</p>
      <button on:click={handleReset}>Asynchronous reset with onSuccess invalidation</button>
    </div>
  </div>
</main>
