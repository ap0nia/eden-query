<script lang="ts">
  import { eden } from '$lib/eden'
  import { createQuery } from '@tanstack/svelte-query'

  const q = eden.api.index.get.createQuery({})

  $: console.log('data: ', $q.data?.data)

  const qq = createQuery({
    queryKey: ['hello'],
    queryFn: async () => {
      return fetch('/api/test').then(async (response) => {
        const text = await response.text()
        return text
      })
    },
  })

  $: console.log('qq: ', $qq.data)
  $: console.log({ data })

  export let data
</script>

<div>
  <h1>Hello, World</h1>
  <pre>{JSON.stringify($q.data, null, 2)}</pre>
</div>
