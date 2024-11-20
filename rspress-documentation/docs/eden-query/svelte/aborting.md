---
title: Aborting Eden-Svelte-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Aborting Eden-Svelte-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Aborting Eden-Svelte-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: Aborting Eden-Svelte-Query - ElysiaJS
---

# Aborting

By default, Eden-Query does not cancel requests via Svelte Query.
If you want to opt into this behaviour, you can provide `abortOnUnmount` in your configuration.

:::info
@tanstack/svelte-query only supports aborting queries.
:::

:::tip
Although this property is named `abortOnUnmount`, it actually means "forward signal from tanstack-query".
tanstack-query's signal facilitates **_additional_** functionality such as cancelling requests
if there's already a duplicate in-progress.
This has been discussed within tRPC [here](https://github.com/trpc/trpc/issues/4448).
:::

### Setup

#### Elysia Server Application

::: code-group

```typescript twoslash include eq-svelte-aborting-application [src/server.ts]
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

```typescript twoslash
// @filename: src/server.ts
// ---cut---
// @include: eq-svelte-aborting-application

// @filename: src/lib/eden.ts
// ---cut---
import { createEdenTreatySvelteQuery } from '@ap0nia/eden-svelte-query'
import type { App } from '../server'

export const eden = createEdenTreatySvelteQuery<App>()
```

:::

### Globally

::: code-group

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// ---cut---
// @include: eq-svelte-aborting-application

// @filename: src/lib/eden.ts
// ---cut---
import { createEdenTreatySvelteQuery } from '@ap0nia/eden-svelte-query'
import type { App } from '../server'

export const eden = createEdenTreatySvelteQuery<App>({
  abortOnUnmount: true,
})
```

:::

### Per-request

You may also override this behaviour at the query level.

::: code-group

```svelte [src/routes/+page.svelte]
<script lang="ts">
  import { eden } from '$lib/eden'
  import type { PageData } from './$types'

  export let data: PageData

  const postQuery = eden.post({ id: data.id }).get.useQuery(
    undefined,
    { eden: { abortOnUnmount: true } },
  )
</script>

```

:::
