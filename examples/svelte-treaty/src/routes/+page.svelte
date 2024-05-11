<script lang="ts">
  import { eden } from '$lib/eden'

  const query = eden.api.index.get.createQuery({})
</script>

<div>
  <h1>Home</h1>
  <pre>{JSON.stringify($query.data, null, 2)}</pre>
</div>
