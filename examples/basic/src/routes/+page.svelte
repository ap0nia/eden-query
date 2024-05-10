<script lang="ts">
  import { eden } from '$lib/eden'
  import type { PageData } from './$types'

  export let data: PageData

  const q = eden.api.index.get.createQuery({})
</script>

<div>
  <h1>Hello, World</h1>
  <pre>{JSON.stringify($q.data, null, 2)}</pre>
</div>
