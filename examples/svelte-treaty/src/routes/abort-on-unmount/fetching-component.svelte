<script lang="ts">
  import { eden } from '$lib/eden'

  const wait = eden.api.wait.get.createQuery({ eden: { abortOnUnmount: true } })
  const count = eden.api.count.get.createQuery({ eden: { abortOnUnmount: true } })
</script>

<div>
  Wait result: {$wait.data?.data}
  Count result: {$count.data?.data}
</div>
