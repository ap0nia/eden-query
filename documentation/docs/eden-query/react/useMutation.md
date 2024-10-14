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

#### Elysia Server Application

::: code-group

```typescript twoslash include eq-react-useMutation-application [server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-react-query/server'

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

#### Eden-Query Client

::: code-group

```typescript twoslash include eq-react-useMutation-client [eden.ts]
// @filename: server.ts
// @include: eq-react-useMutation-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()
```

:::

::: code-group

```typescript twoslash [index.tsx]

// @filename: server.ts
// @include: eq-react-useMutation-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()

// @filename: index.tsx
// ---cut---
import React from 'react'
import { eden } from './eden'

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

:::
