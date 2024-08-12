---
title: useMutation Eden-React-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: useMutation Eden-React-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: useMutation Eden-React-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: useMutation Eden-React-Query - ElysiaJS
---

# useMutation

:::info
The hooks provided by `@trpc/react-query` are a thin wrapper around @tanstack/react-query.
For in-depth information about options and usage patterns,
refer to their docs on [mutations](https://tanstack.com/query/v5/docs/framework/react/guides/mutations).
:::

Works like react-query's mutations - [see their docs](https://tanstack.com/query/v5/docs/framework/react/guides/mutations).

### Example

<template>

```typescript twoslash include react-useMutation-application
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-react-query'

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

```typescript twoslash include react-useMutation-eden
// @noErrors
import { createEdenTreatyReactQuery, httpBatchLink } from '@ap0nia/eden-react-query'
import type { App } from '../server'

export const eden = createEdenTreatyReactQuery<App>()

export const client = eden.createClient({
  links: [
    httpBatchLink({
      domain: 'http://localhost:3000',
    }),
  ],
})
```

</template>

::: code-group

```typescript twoslash [src/components/MyComponent.tsx]

// @filename: src/server.ts
// @include: react-useMutation-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: react-useMutation-eden

// @filename: src/components/MyComponent.tsx
// ---cut---
import React from 'react'
import { eden } from '../lib/eden'

export function MyComponent() {
  // This can either be a tuple ['login'] or string 'login'
  const mutation = eden.login.post.useMutation()

  const handleLogin = () => {
    const name = 'John Doe'

    mutation.mutate({ name })
  }

  return (
    <div>
      <h1>Login Form</h1>
      <button onClick={handleLogin} disabled={mutation.isPending}>
        Login
      </button>

      {mutation.error && <p>Something went wrong! {mutation.error.message}</p>}
    </div>
  )
}
```

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// @include: react-useMutation-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: react-useMutation-eden
```

```typescript twoslash [src/server.ts]
// @include: react-useMutation-application
```

:::
