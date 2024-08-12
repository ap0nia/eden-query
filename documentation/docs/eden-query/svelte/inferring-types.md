---
title: Inferring Types Eden-Svelte-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Inferring Types Eden-Svelte-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Inferring Types Eden-Svelte-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: Inferring Types Eden-Svelte-Query - ElysiaJS
---

# Inferring Types

<template>

```typescript twoslash include svelte-infer-application
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

```typescript twoslash include svelte-infer-eden
// @noErrors
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

</template>

1. Create Elysia application

::: code-group

```typescript twoslash [src/server.ts]
// @include: svelte-infer-application
```

:::

2. Create Eden hooks

::: code-group

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// @include: svelte-infer-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: svelte-infer-eden
// @noErrors

type A = InferInput['post']['
                          // ^|


type B = InferInput['post'][':id']['
                                 // ^|


type C = InferInput['post'][':id']['get']

type PrettifiedInput = { [K in keyof C]: C[K] }

type InputQuery = PrettifiedInput['query']

type InputParams = PrettifiedInput['params']
```

```typescript twoslash [src/server.ts]
// @include: svelte-infer-application
```

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

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// @include: svelte-infer-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: svelte-infer-eden
```

```typescript twoslash [src/server.ts]
// @include: svelte-infer-application
```
