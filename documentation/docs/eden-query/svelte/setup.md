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

<template>

```typescript twoslash include svelte-setup-application
import { Elysia, t } from 'elysia'
import { edenPlugin } from '@ap0nia/eden-svelte-query'

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

```typescript twoslash include svelte-setup-client
// @noErrors
import { createEdenTreatySvelteQuery } from '@ap0nia/eden-svelte-query'
import type { App } from '../server'

export const eden = createEdenTreatySvelteQuery<App>()
```

</template>

### 1. Install dependencies

```sh npm2yarn
npm install elysia @ap0nia/eden-svelte-query @tanstack/react-query
```

### 2. Create Elysia server application

::: code-group

```typescript twoslash [src/server.ts]
// @include: svelte-setup-application
```

:::

### 3. Create eden-treaty hooks

Create a set of strongly-typed React hooks from your `App` type signature with `createEdenTreatyReactQuery`.

::: code-group

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// @include: svelte-setup-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: svelte-setup-client
```

```typescript twoslash [src/server.ts]
// @include: svelte-setup-application
```

:::

### 4. Add eden providers

Create an Eden client, and wrap your application in the Eden Provider, as below.
You will also need to set up and connect React-Query,
which [is documented here in more depth](https://tanstack.com/query/latest/docs/framework/react/quick-start).

:::tip
If you already use React Query in your application,
you **should** re-use the `QueryClient` and `QueryClientProvider` you already have.
:::

::: code-group

```html [src/routes/+layout.svelte]
<script lang="ts">
  import type { PageData } from './$types'

  /**
   * This data has both `client` and `queryClient`, which are the only properties that `setContext` reads.
   * You can specify only those properties instead of passing the entire object.
   */
  export let data: PageData

  $: eden.setContext(data)
</script>

<slot />
```

```typescript twoslash [src/routes/+layout.ts]
// @filename: src/server.ts
// @include: svelte-setup-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: svelte-setup-client

// @filename: src/routes/$types.ts'
// ---cut---

export type PageLoad = any

// @filename: src/routes/+layout.ts
// ---cut---
import { QueryClient } from '@tanstack/svelte-query'
import { httpBatchLink } from '@ap0nia/eden-svelte-query'
import { eden } from '../lib/eden'
import type { PageLoad } from './$types'

function getAuthCookie() {
  return null
}

export const load: PageLoad = async (event) => {
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

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// @include: svelte-setup-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: svelte-setup-client
```

```typescript twoslash [src/server.ts]
// @include: svelte-setup-application
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

  const userQuery = eden.user.get.useQuery({ query: { id: 'id_bilbo' }})
  const userCreator = eden.user.post.useMutation()
</script>

<div>
  <p>{$userQuery.data?.name}</p>
  <button on:click={() => $userCreator.mutate({ name: 'Frodo' })}>
    Create Frodo
  </button>
</div>
```

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// @include: svelte-setup-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: svelte-setup-client
```

```typescript twoslash [src/server.ts]
// @include: svelte-setup-application
```

:::
