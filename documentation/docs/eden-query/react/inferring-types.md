---
title: Inferring Types Eden-React-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Inferring Types Eden-React-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Inferring Types Eden-React-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: Inferring Types Eden-React-Query - ElysiaJS
---

# Inferring Types

1. Create Elysia application

::: code-group

```typescript twoslash include eq-react-infer-application [src/server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-svelte-query'

export const app = new Elysia().use(batchPlugin()).get('/post/:id', (context) => {
  return {
    id: context.params.id,
    title: 'Look me up!',
  }
})

export type App = typeof app
```

:::

2. Initialize Eden-Query Hooks and Types

::: tip
`InferRouteOptions`: gets the `query` and `params` required for the route.

`InferRouteBody`: gets the `body` required for the route, e.g. POST, PATCH, etc. endpoints.
:::

::: code-group

```typescript twoslash [src/lib/eden.ts]
// @noErrors

// @filename: src/server.ts
// ---cut---
// @include: eq-react-infer-application

// @filename: src/lib/eden.ts
// ---cut---
import {
  createEdenTreatyReactQuery,
  type InferTreatyQueryInput,
  type InferTreatyQueryOutput,
} from '@ap0nia/eden-react-query'
import type { App } from '../server'

export const eden = createEdenTreatyReactQuery<App>()

export type InferInput = InferTreatyQueryInput<App>

export type InferOutput = InferTreatyQueryOutput<App>

type A = InferInput['post']['
                          // ^|


type B = InferInput['post'][':id']['
                                 // ^|


type C = InferInput['post'][':id']['get']

type PrettifiedInput = { [K in keyof C]: C[K] }

type InputQuery = PrettifiedInput['query']

type InputParams = PrettifiedInput['params']
```

:::

3. Use inference helpers

::: code-group

```svelte [src/routes/+page.svelte]
<script lang="ts">
  import { eden, type InferInput } from '$lib/eden'

  const input = writable<InferInput['post'][':id']['get']>({ params: { id: '' }})

  const post = eden.post[':id'].get.createQuery(input)
</script>

<input bind:value={$input.params.id}>
```

:::
