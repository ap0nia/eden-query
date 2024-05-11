<script lang="ts">
  import { eden } from '$lib/eden'

  const query = eden.api.wait.get.createQuery({ eden: { abortOnUnmount: true } })
</script>

<div>
  Query result: {$query.data?.data}
</div>
