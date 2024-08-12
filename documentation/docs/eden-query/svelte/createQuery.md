---
title: createQuery Eden-Svelte-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: createQuery Eden-Svelte-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: createQuery Eden-Svelte-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: createQuery Eden-Svelte-Query - ElysiaJS
---

# createQuery

:::info
The hooks provided by `@ap0nia/eden-svelte-query` are a thin wrapper around @tanstack/svelte-query.
For in-depth information about options and usage patterns,
refer to their docs on [queries](https://tanstack.com/query/v5/docs/framework/react/guides/queries).
:::

```typescript
function createQuery(
  input: StoreOrVal<TInput>,
  options?: UseEdenQueryOptions;
)

interface EdenCreateQueryOptions extends CreateQueryOptions {
  eden: {
    abortOnUnmount?: boolean;
    context?: Record<string, unknown>;
  }
}
```

Since `EdenCreateQueryOptions` extends @tanstack/svelte-query's `CreateQueryOptions`,
you can use any of their options here such as `enabled`, `refetchOnWindowFocus`, etc.
We also have some `eden` specific options that let you opt in or out of certain behaviors on a per-procedure level:

- **`eden.abortOnUnmount`:** Override the [global config](/../sveltekit/setup#config-callback) and opt in or out of aborting queries on unmount.
- **`eden.context`:** Add extra meta data that could be used in [Links](../links).

:::tip
If you need to set any options but don't want to pass any input,
you can pass `undefined` instead.
:::

You'll notice that you get autocompletion on the `input` based on what you have set in your `input` schema on your backend.

### Example

<template>

```typescript twoslash include svelte-createQuery-application
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-svelte-query'

export const app = new Elysia().use(batchPlugin()).get(
  '/hello',
  (context) => {
    return {
      greeting: `hello ${context.query?.text ?? 'world'}`,
    }
  },
  {
    query: t.Object({
      text: t.Optional(t.String()),
    }),
  },
)

export type App = typeof app
```

```typescript twoslash include svelte-createQuery-eden
// @noErrors
import { createEdenTreatySvelteQuery } from '@ap0nia/eden-svelte-query'
import type { App } from '../server'

export const eden = createEdenTreatySvelteQuery<App>()
```

</template>

::: code-group

```svelte [src/routes/+page.svelte]
<script lang="ts">
  import { eden } from '$/lib/eden'

  const helloNoArgs = eden.hello.get.useQuery({ query: { }})
  const helloWithArgs = eden.hello.get.useQuery({ query: { text: 'client' }})
</script>

<div>
  <h1>Hello World Example</h1>

  <ul>
    <li>
      <span>helloNoArgs ({$helloNoArgs.status}): </span>
      <pre>{JSON.stringify($helloNoArgs.data, null, 2)}</pre>
    </li>

    <li>
      <span>helloWithArgs ({$helloWithArgs.status}): </span>
      <pre>{JSON.stringify($helloWithArgs.data, null, 2)}</pre>
    </li>
  </ul>
</div>
```

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// @include: svelte-createQuery-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: svelte-createQuery-eden
```

```typescript twoslash [src/server.ts]
// @include: svelte-createQuery-application
```

:::

## (WIP...) Streaming responses using async generators {#streaming}

:::info
Since v11 we now support streaming queries when using the
[`httpBatchStreamLink`](../links/httpBatchStreamLink.md#generators).
:::

When returning an async generators in a query, you will:

- Get the results of the iterator in the `data`-property **as an array** which updates as the response comes in
- The `status` will remain as `pending` until the full response has been received.

### Example

```tsx title='server/routers/_app.ts'
import { publicProcedure, router } from './trpc'

const appRouter = router({
  iterable: publicProcedure.query(async function* () {
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      yield i
    }
  }),
})

export type AppRouter = typeof appRouter
```

```tsx title='components/MyComponent.tsx'
import { trpc } from '~/utils'

export function MyComponent() {
  const query = trpc.iterable.useQuery()

  return <div>{query.data?.map((chunk, index) => <Fragment key={index}>{chunk}</Fragment>)}</div>
}
```
