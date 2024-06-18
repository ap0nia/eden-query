# @ap0nia/eden-query

> @elysiajs/eden + @tanstack-svelte-query integration

## Quick Start

1. Install this library.

```sh
pnpm install @ap0nia/eden-svelte-query
```

2. Initialize a new eden-svelte-query instance.

```ts
// src/lib/eden.ts

import { createEdenTreatyQuery } from '@ap0nia/eden-query'
import type { App } from '$lib/server'

export const eden = createEdenTreatyQuery<App>()
```

3. Initialize svelte-query and set the eden-svelte-query context.

```html
<script>
  // src/routes/+layout.svelte

  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import { eden } from '$lib/eden'

  const queryClient = new QueryClient()

  eden.setContext(queryClient)
</script>

<QueryClientProvider client="{queryClient}">
  <slot />
</QueryClientProvider>
```

- Setting up the `QueryClientProvider` is required for svelte-query.
- Setting the eden-svelte-query context allows `eden.useContext()` function to use the correct queryClient.

4. Create a query, a mutation, and an invalidation function.

```html
<script>
  // src/routes/+page.svelte

  import { eden } from '$lib/eden'

  let newGreeting = ''

  const utils = eden.getContext()

  const greeting = eden.api.greeting.get.createQuery({})

  const mutateGreeting = eden.api.greeting.post.createMutation()

  async function changeGreeting() {
    const result = await $mutateGreeting.mutateAsync(newGreeting)
    console.log('mutation result: ', result)
    await utils.api.greeting.get.invalidate()
  }
</script>

<div>
  <p>The message is: {$greeting.data}</p>

  <label>
    <p>New Greeting</p>
    <input bind:value="{newGreeting}" type="text" />
  </label>

  <button on:click="{changeGreeting}">Change Greeting</button>
</div>
```

> Important Notes

- `greeting` updates with the value of the most currently fetched greeting.
- `mutateGreeting` is a mutation that can be used to make `POST` requests to update the greeting on the server.
- `utils` exposes a treaty-like interface with utilities like invalidating, fetch, pre-fetching, etc.
- `invalidating` a route will cause any queries on that route to be refetched.
  e.g. since `api.greeting.get` was invalidated, the `api.greeting.get.createQuery` store will be refetched.

### SvelteKit + Elysia.js implementation details

Initialize the elysia server.

```ts
// src/lib/server/index.ts

import { t, Elysia } from 'elysia'

let greeting = 'Hello, World!'

export const app = new Elysia({ prefix: '/api' })
  .get('/greeting', () => greeting)
  .post(
    '/greeting',
    (context) => {
      console.log('Received new greeting: ', context.body)
      greeting = context.body
      return 'OK'
    },
    {
      body: t.String(),
    },
  )

export type App = typeof app
```

Add a catch-all server route for the Elysia app to handle requests.

```ts
// src/routes/api/[...elysia]/+server.ts

import type { RequestHandler } from '@sveltejs/kit'
import { app } from '$lib/server'

const handler: RequestHandler = async (event) => await app.handle(event.request)

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
```

## Remarks

Ideas for batching:

https://learn.microsoft.com/en-us/sharepoint/dev/sp-add-ins/make-batch-requests-with-the-rest-apis
