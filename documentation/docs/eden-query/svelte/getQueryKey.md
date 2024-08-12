---
title: getQueryKey Eden-Svelte-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: getQueryKey Eden-Svelte-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: getQueryKey Eden-Svelte-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: getQueryKey Eden-Svelte-Query - ElysiaJS
---

# getQueryKey

<template>

```typescript twoslash include svelte-getQueryKey-application
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-svelte-query'

export const app = new Elysia().use(batchPlugin()).get('/post/list', () => {
  return []
})

export type App = typeof app
```

```typescript twoslash include svelte-getQueryKey-eden
// @noErrors
import { createEdenTreatySvelteQuery } from '@ap0nia/eden-svelte-query'
import type { App } from '../server'

export const eden = createEdenTreatySvelteQuery<App>()
```

</template>

We provide a getQueryKey helper that accepts a `router` or `procedure` so that you can easily provide the native function the correct query key.

```tsx
// Queries
function getQueryKey(
  procedure: AnyQueryProcedure,
  input?: DeepPartial<TInput>,
  type?: QueryType; /** @default 'any' */
): EdenQueryKey;

// Routers
function getQueryKey(
  router: AnyRouter,
): EdenQueryKey;

type QueryType = "query" | "infinite" | "any";
// for useQuery ──┘         │            │
// for useInfiniteQuery ────┘            │
// will match all ───────────────────────┘
```

:::info

The query type `any` will match all queries in the cache only if the `svelte query` method where it's used uses fuzzy matching.
See [TanStack/query#5111 (comment)](https://github.com/TanStack/query/issues/5111#issuecomment-1464864361) for more context.

:::

::: code-group

```svelte [src/routes/+page.svelte]
<script lang="ts">
  import { useIsFetching, useQueryClient } from '@tanstack/svelte-query'
  import { getQueryKey } from '@ap0nia/eden-svelte-query'
  import { eden } from '$lib/eden'

  const queryClient = useQueryClient()

  const posts = eden.post.list.get.useQuery()

  // See if a query is fetching
  const postListKey = getQueryKey(eden.post.list, undefined, 'query')
  const isFetching = useIsFetching(postListKey)

  // Set some query defaults for an entire router
  const postKey = getQueryKey(eden.post)
  queryClient.setQueryDefaults(postKey, { staleTime: 30 * 60 * 1000 })
  // ...
</script>

// ...
```

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// @include: svelte-getQueryKey-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: svelte-getQueryKey-eden
```

```typescript twoslash [src/server.ts]
// @include: svelte-getQueryKey-application
```

:::

## Mutations

Similarly to queries, we provide a getMutationKey for mutations.
The underlying function is the same as getQueryKey (in fact, you could technically use getQueryKey for mutations as well),
the only difference is in semantics.

```tsx
export function getMutationKey<TSchema extends RouteSchema>(
  route: EdenTreatySvelteQueryHooksImplementation<TSchema>,
  options?: EdenQueryKeyOptions,
): EdenMutationKey
```
