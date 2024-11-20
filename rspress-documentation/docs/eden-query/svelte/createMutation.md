---
title: createMutation Eden-Svelte-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: useMutation Eden-Svelte-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: useMutation Eden-Svelte-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: useMutation Eden-Svelte-Query - ElysiaJS
---

# createMutation

:::info
The hooks provided by `@ap0nia/eden-svelte-query` are a thin wrapper around @tanstack/svelte-query.
For in-depth information about options and usage patterns,
refer to their docs on [mutations](https://tanstack.com/query/v5/docs/framework/react/guides/mutations).
:::

Works like svelte-query's mutations - [see their docs](https://tanstack.com/query/v5/docs/framework/react/guides/mutations).

### Setup

#### Elysia Server Application

This is the Elysia application that will be used for the following examples.

::: code-group

```typescript twoslash include eq-svelte-createMutation-application [src/server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-svelte-query/server'

export const app = new Elysia().use(batchPlugin()).post(
  '/login',
  (context) => {
    return {
      user: {
        name: context.body.name,
        role: 'ADMIN',
      },
    }
  },
  {
    body: t.Object({
      name: t.String(),
    }),
  },
)

export type App = typeof app
```

:::

#### Eden-Query

::: code-group

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// ---cut---
// @include: eq-svelte-createMutation-application

// @filename: src/lib/eden.ts
// ---cut---
import { createEdenTreatySvelteQuery } from '@ap0nia/eden-svelte-query'
import type { App } from '../server'

export const eden = createEdenTreatySvelteQuery<App>()
```

:::

### Example

::: code-group

```svelte [src/routes/+page.svelte]
<script lang="ts">
  import { eden } from '$lib/eden'

  const mutation = eden.login.post.useMutation()

  const handleLogin = () => {
    const name = 'John Doe'
    $mutation.mutate({ name })
  }
</script>

<div>
  <h1>Login Form</h1>

  <button on:click={handleLogin} disabled={$mutation.isPending}>
    Login
  </button>

  {$mutation.error && <p>Something went wrong! {$mutation.error.message}</p>}
</div>
```

:::
