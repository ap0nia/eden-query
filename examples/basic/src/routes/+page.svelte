<script lang="ts">
  import { eden } from '$lib/eden'

  const q = eden.api.index.get.createQuery({})

  $: console.log('data: ', $q.data?.data)
</script>

<div>
  <h1>Hello, World</h1>
  <pre>{JSON.stringify($q.data, null, 2)}</pre>
</div>
