---
title: createUtils Eden-Svelte-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: createUtils Eden-Svelte-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: createUtils Eden-Svelte-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: createUtils Eden-Svelte-Query - ElysiaJS
---

# createUtils

Similar to `useUtils`, `createUtils` is a method on the root proxy that gives you access
to helpers that let you manage the cached data of the queries you execute via `@ap0nia/eden-svelte-query`.
These helpers are actually thin wrappers around
`@tanstack/svelte-query`'s [`queryClient`](https://tanstack.com/query/v5/docs/reference/QueryClient) methods.
If you want more in-depth information about options and usage patterns for `useUtils` helpers than what we provide here,
we will link to their respective `@tanstack/svelte-query` docs so you can refer to them accordingly.

:::tip

The difference between `useUtils` and `createUtils` is that `useUtils` is a svelte hook that uses `useQueryClient` under the hood.
This means that it is intended to be used within Svelte Components.
The use case for `createUtils` is when you need to use the helpers outside of a Svelte Component,
for example inside of `load` functions in `+page.ts`.

:::

:::warning

You should avoid using `createUtils` in Svelte Components.
Instead, use `useUtils` which is a Svelte hook that implements `getContext` and `useQueryClient` under the hood.

:::

### Setup

#### Elysia Server Application

::: code-group

```typescript twoslash include eq-svelte-createUtils-application [src/server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-svelte-query/server'

export const app = new Elysia().use(batchPlugin()).get('/post/all', (context) => {
  return {
    posts: [
      { id: 1, title: 'everlong' },
      { id: 2, title: 'After Dark' },
    ],
  }
})

export type App = typeof app
```

:::

#### Eden-Query Hooks

::: code-group

```typescript twoslash  [src/lib/eden.ts]
// @filename: src/server.ts
// ---cut---
// @include: eq-svelte-createUtils-application

// @filename: src/lib/eden.ts
// ---cut---
import { createEdenTreatySvelteQuery } from '@ap0nia/eden-svelte-query'
import type { App } from '../server'

export const eden = createEdenTreatySvelteQuery<App>()
```

:::

## Usage

`createUtils` returns an object that looks like `useUtils` --
with all the available queries you have in your routers.
You use it the same way as your `eden` utils object.
Once you reach a query, you'll have access to the query helpers.

In our component, when we navigate, we use the object `createUtils` gives us and
in order to prefetch the `post.all` query.
In addition, we have access to all our query helpers!

::: code-group

```svelte [src/routes/+page.svelte]
<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData
</script>

<div>
  {JSON.stringify(data, null, 2)}
</div>
```

:::

:::warning

If you were using Remix Run, SSR, e.g. Next.js, SvelteKit, etc. **_do not re-use_** the same `queryClient` for every request.
This may lead to cross-request data leakage. Instead, create a new `queryClient` for every request so that .

:::

## Helpers

Much like `useUtils`, `createUtils` gives you access to same set of helpers.
The only difference is that you need to pass in the `queryClient` and `client` objects.

You can see them on the [useUtils](./useUtils) page.
