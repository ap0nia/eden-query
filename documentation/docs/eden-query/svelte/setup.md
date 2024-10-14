---
title: Setup Eden-Svelte-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Setup Eden-Svelte-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Setup Eden-Svelte-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: Setup Eden-Svelte-Query - ElysiaJS
---

# Setup

### Elysia Server Application

This is the server that will be used for the following examples.

### Eden-Query Client

Make sure that the eden proxy and client are setup.

## Steps

### 1. Install dependencies

```sh npm2yarn
npm install elysia @ap0nia/eden-svelte-query @tanstack/react-query
```

### 2. Create Elysia server application

::: code-group

```typescript twoslash include eq-svelte-setup-application [src/server.ts]
import { Elysia, t } from 'elysia'
import { edenPlugin } from '@ap0nia/eden-svelte-query/server'

const users = [
  {
    id: 'id_bilbo',
    name: 'bilbo',
  },
]

export const app = new Elysia()
  .use(edenPlugin({ batch: true }))
  .get('/', () => 'Hello, World!')
  .get(
    '/user',
    (context) => {
      return users.find((user) => user.id === context.query.id)
    },
    {
      query: t.Object({
        id: t.String(),
      }),
    },
  )
  .post(
    '/user',
    (context) => {
      const newUser = {
        id: `id_${context.body.name}`,
        name: context.body.name,
      }

      users.push(newUser)

      return users
    },
    {
      body: t.Object({
        name: t.String(),
      }),
    },
  )

export type App = typeof app
```

:::

### 3. Create Eden-Query Hooks

Create a set of strongly-typed React hooks from your `App` type signature with `createEdenTreatyReactQuery`.

::: code-group

```typescript twoslash [src/lib/eden.ts]
// @filename: server.ts
// ---cut---
// @include: eq-svelte-setup-application

// @filename: src/lib/eden.ts
// ---cut---
import { createEdenTreatySvelteQuery } from '@ap0nia/eden-svelte-query'
import type { App } from '../../server'

export const eden = createEdenTreatySvelteQuery<App>()
```

:::

### 4. Initialize QueryClient and Eden Client

::: tip
If you are using client-side only Svelte, then you can initialize the `QueryClient` and `EdenClient`
in `src/routes/+layout.svelte`.

Initializing them in `src/routes/+layout.ts` ensures that each request will receive a clean
cache, preventing leaks.
:::

::: code-group

```typescript twoslash [src/routes/+layout.ts]
// @filename: src/server.ts
// @include: eq-svelte-setup-application

// @filename: src/lib/eden.ts
// ---cut---
import { createEdenTreatySvelteQuery } from '@ap0nia/eden-svelte-query'
import type { App } from '../server'

export const eden = createEdenTreatySvelteQuery<App>()
// @filename: src/routes/$types.ts'
// ---cut---

export type PageLoad = any

// @filename: src/routes/+layout.ts
// ---cut---
import { httpBatchLink } from '@ap0nia/eden-svelte-query'
import { QueryClient } from '@tanstack/svelte-query'
import type { RequestEvent } from '@sveltejs/kit'
import { eden } from '../lib/eden'

function getAuthCookie() {
  return undefined
}

export const load = async (event: RequestEvent) => {
  const queryClient = new QueryClient()

  const client = eden.createClient({
    links: [
      httpBatchLink({
        fetcher: event.fetch,

        // You can pass any HTTP headers you wish here
        async headers() {
          return {
            authorization: getAuthCookie(),
          }
        },
      }),
    ],
  })

  return { queryClient, client }
}
```

:::

### 5. Initialize Eden-Query Providers.

::: code-group

```html [src/routes/+layout.svelte]
<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData

  $: eden.setContext(data)
</script>

<slot />
```

:::

:::info
The reason for initializing the `queryClient` and `client` inside of `+layout.ts` is to ensure
that each request gets a unique client when using SSR.
If you only use client side rendering, then you can move all the code to `+layout.svelte`
:::

#### 5. Fetch data

You can now use the eden-treaty React Query integration to call queries and mutations on your API.

::: code-group

```svelte [src/routes/+page.svelte]
<script lang="ts">
  import { eden } from '$lib/eden'

  const userQuery = eden.user.get.useQuery({ id: 'id_bilbo' })
  const userCreator = eden.user.post.useMutation()
</script>

<div>
  <p>{$userQuery.data?.name}</p>
  <button on:click={() => $userCreator.mutate({ name: 'Frodo' })}>
    Create Frodo
  </button>
</div>
```

:::
