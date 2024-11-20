---
title: Reactive Inputs Eden-Svelte-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Reactive Inputs Eden-Svelte-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Reactive Inputs Eden-Svelte-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: Reactive Inputs Eden-Svelte-Query - ElysiaJS
---

# Reactive Inputs

To create queries that are reactive to an external source, wrap your input in a store, e.g.
`writable`, `readable`, or `derived` from `svelte`.

:::tip
To get the type of input for the route, use the [inference helpers](./inferring-types)
:::

### Setup

#### Elysia Server Application

::: code-group

```typescript twoslash include eq-svelte-reactive-application [src/server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-svelte-query/server'

export const app = new Elysia().use(batchPlugin()).get('/post/:id', (context) => {
  return {
    id: context.params.id,
    title: 'Look me up!',
  }
})

export type App = typeof app
```

:::

#### Eden-Query Hooks

::: code-group

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// ---cut---
// @include: eq-svelte-reactive-application

// @filename: src/lib/eden.ts
// ---cut---
import {
  createEdenTreatySvelteQuery,
  type InferTreatyQueryInput,
  type InferTreatyQueryOutput,
} from '@ap0nia/eden-svelte-query'
import type { App } from '../server'

export const eden = createEdenTreatySvelteQuery<App>()

export type InferInput = InferTreatyQueryInput<App>

export type InferOutput = InferTreatyQueryOutput<App>
```

:::

### Svelte

::: code-group

```svelte [src/routes/+page.svelte]
<script lang="ts">
  import { eden, type InferInput } from '$lib/eden'

  const id = writable({ id: '' })

  const post = eden.post(id).get.createQuery(input)
</script>

<input bind:value={$id.id}>
```

:::
