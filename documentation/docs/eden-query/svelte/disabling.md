---
title: Disabling Eden-Svelte-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Disabling Eden-Svelte-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Disabling Eden-Svelte-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: Disabling Eden-Svelte-Query - ElysiaJS
---

# Disabling

<template>

```typescript twoslash include svelte-disabling-application
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-svelte-query'

export const app = new Elysia().use(batchPlugin()).get('/user/:name', (context) => {
  return {
    name: context.params.name,
  }
})

export type App = typeof app
```

```typescript twoslash include svelte-disabling-eden
// @noErrors
import { createEdenTreatySvelteQuery } from '@ap0nia/eden-svelte-query'
import type { App } from '../server'

export const eden = createEdenTreatySvelteQuery<App>()
```

</template>

To disable queries, you can pass `skipToken` as the first argument to `useQuery` or `useInfiniteQuery`. This will prevent the query from being executed.

### Typesafe conditional queries using `skipToken`

::: code-group

```svelte [src/routes/+page.svelte]
<script lang="ts">
  import { skipToken } from '@tanstack/svelte-query'
  import { eden } from '$lib/eden'

  let name = ''

  const result = eden.user[':name'].get.useQuery(name ? { params: { name } } : skipToken)
</script>

// ...
```

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// @include: svelte-disabling-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: svelte-disabling-eden
```

```typescript twoslash [src/server.ts]
// @include: svelte-disabling-application
```

:::
