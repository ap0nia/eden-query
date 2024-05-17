<script lang="ts">
  import { eden } from '$lib/eden'

  const index = eden.api.index.get.createQuery({})
  const count = eden.api.count.get.createQuery({})
</script>

<div>
  <h1>Home</h1>
  <pre>{JSON.stringify($index.data, null, 2)}</pre>
  <pre>{JSON.stringify($count.data, null, 2)}</pre>
</div>
