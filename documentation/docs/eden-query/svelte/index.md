---
title: Eden-Svelte-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Eden-Svelte-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Eden-Svelte-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: Eden-Svelte-Query - ElysiaJS
---

# Eden-Svelte-Query

Eden-Svelte-Query offers a first class integration with Svelte.
Under the hood this is simply a wrapper around the very popular [@tanstack/svelte-query](https://tanstack.com/query/latest),
so we recommend that you familiarise yourself with Svelte Query,
as their docs go in to much greater depth on its usage.

:::tip
If you are using SvelteKit we recommend using [our integration with that](../sveltekit) instead

(WIP)
:::

### The Eden Svelte Query Integration

This library enables usage directly within Svelte components

#### Elysia Server Application

::: code-group

```typescript twoslash include eq-svelte-index-application [src/server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-svelte-query/server'

export const app = new Elysia()
  .use(batchPlugin())
  .get(
    '/hello',
    (context) => {
      return { greeting: `Hello, ${context.query.name}!` }
    },
    {
      query: t.Object({
        name: t.String(),
      }),
    },
  )
  .post('/goodbye', () => {
    console.log('Goodbye!')
  })

export type App = typeof app
```

:::

#### Eden-Query Client

::: code-group

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// ---cut---
// @include: eq-svelte-index-application

// @filename: src/lib/eden.ts
// ---cut---
import { createEdenTreatySvelteQuery } from '@ap0nia/eden-svelte-query'
import type { App } from '../server'

export const eden = createEdenTreatySvelteQuery<App>()
```

:::

::: code-group

```svelte [src/routes/+page.svelte]
<script lang="ts">
  import { eden } from '../lib/eden'

  const helloQuery = eden.hello.get.createQuery({ name: 'Bob' })
  const goodbyeMutation = eden.goodbye.post.createMutation()
</script>

<div>
  <p>{$helloQuery.data?.greeting}</p>
  <button on:click={() => goodbyeMutation.mutate()}>Say Goodbye</button>
</div>

```

:::

### Differences to vanilla Svelte Query

The wrapper abstracts some aspects of Svelte Query for you:

- Query Keys - these are generated and managed by eden on your behalf, based on the procedure inputs you provide.
  - If you need the query key which eden calculates, you can use [getQueryKey](./getQueryKey).
- Type safe by default - the types you provide in your Elysia Backend also drive the types of your Svelte Query client,
  providing safety throughout your Svelte app.
