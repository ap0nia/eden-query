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

### Setup

#### Elysia Server Application

::: code-group

```typescript twoslash include eq-svelte-disabling-application [src/server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-svelte-query/server'

export const app = new Elysia().use(batchPlugin()).get(
  '/user',
  (context) => {
    return {
      name: context.query.name,
    }
  },
  {
    query: t.Object({
      name: t.String(),
    }),
  },
)

export type App = typeof app
```

:::

#### Eden-Query HOoks

::: code-group

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// ---cut---
// @include: eq-svelte-disabling-application

// @filename: src/lib/eden.ts
// ---cut---
import { createEdenTreatySvelteQuery } from '@ap0nia/eden-svelte-query'
import type { App } from '../server'

export const eden = createEdenTreatySvelteQuery<App>()
```

:::

To disable queries, you can pass `skipToken` as the first argument to `useQuery` or `useInfiniteQuery`. This will prevent the query from being executed.

### Typesafe conditional queries using `skipToken`

::: code-group

```svelte [src/routes/+page.svelte]
<script lang="ts">
  import { skipToken } from '@tanstack/svelte-query'
  import { eden } from '$lib/eden'

  let name = ''

  const result = eden.user.get.useQuery(name ? { name } : skipToken)
</script>

// ...
```

:::
