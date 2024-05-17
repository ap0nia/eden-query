<script lang="ts">
  import { eden } from '$lib/eden'
  import { onMount } from 'svelte'

  const query = eden.api.index.get.createQuery({})

  onMount(async () => {
    const body = new FormData()

    body.append(`0.method`, 'GET')
    body.append(`0.path`, '/api/count')

    body.append(`1.method`, 'GET')
    body.append(`1.path`, '/api')

    const response = await fetch('/api/batch', { method: 'POST', body })

    console.log('response: ', response)
  })
</script>

<div>
  <h1>Home</h1>
  <pre>{JSON.stringify($query.data, null, 2)}</pre>
</div>
