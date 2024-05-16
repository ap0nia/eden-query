<script lang="ts">
  import { eden } from '$lib/eden'
  import { onMount } from 'svelte'
  import { nanoid } from 'nanoid'

  const query = eden.api.index.get.createQuery({})

  onMount(async () => {
    const body = new FormData()

    const id1 = nanoid()
    const id2 = nanoid()

    body.append(`${id1}.method`, 'GET')
    body.append(`${id1}.path`, '/api/count')

    body.append(`${id2}.method`, 'GET')
    body.append(`${id2}.path`, '/api')

    const response = await fetch('/api/batch', { method: 'POST', body })

    console.log('response: ', response)
  })
</script>

<div>
  <h1>Home</h1>
  <pre>{JSON.stringify($query.data, null, 2)}</pre>
</div>
