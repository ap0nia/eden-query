<script lang="ts">
  import { eden } from '$lib/eden'

  const mutation = eden.api.count.put.createMutation()

  async function handleClick() {
    await $mutation.mutateAsync(
      undefined,
    )
  }
</script>

<main>
  <div>
    <h1>createMutation</h1>
  </div>
</main>
