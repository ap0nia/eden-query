---
title: Setup Eden-React-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Setup Eden-React-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Setup Eden-React-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: Setup Eden-React-Query - ElysiaJS
---

<template>

```typescript twoslash include react-setup-basic-example
import { Elysia, t } from 'elysia'
import { edenPlugin } from '@ap0nia/eden-react-query'

const users = [
  {
    id: 'id_bilbo',
    name: 'bilbo',
  },
]

export const app = new Elysia()
  .use(edenPlugin({ batch: true }))
  .get('/', () => 'Hello, World!')
  .get(
    '/user',
    (context) => {
      return users.find((user) => user.id === context.query.id)
    },
    {
      query: t.Object({
        id: t.String(),
      }),
    },
  )
  .post(
    '/user',
    (context) => {
      const newUser = {
        id: `id_${context.body.name}`,
        name: context.body.name,
      }

      users.push(newUser)

      return users
    },
    {
      body: t.Object({
        name: t.String(),
      }),
    },
  )

export type App = typeof app
```

```typescript twoslash include react-setup-client
// @noErrors
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from '../server'

export const eden = createEdenTreatyReactQuery<App>()
```

</template>

### 1. Install dependencies

```sh npm2yarn
npm install elysia @ap0nia/eden-react-query @tanstack/react-query
```

### 2. Create Elysia server application

::: code-group

```typescript twoslash [src/server.ts]
// @include: react-setup-basic-example
```

:::

### 3. Create eden-treaty hooks

Create a set of strongly-typed React hooks from your `App` type signature with `createEdenTreatyReactQuery`.

::: code-group

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// @include: react-setup-basic-example

// @filename: src/lib/eden.ts
// ---cut---
// @include: react-setup-client
```

```typescript twoslash [src/server.ts]
// @include: react-setup-basic-example
```

:::

### 4. Add eden providers

Create an Eden client, and wrap your application in the Eden Provider, as below.
You will also need to set up and connect React-Query,
which [is documented here in more depth](https://tanstack.com/query/latest/docs/framework/react/quick-start).

:::tip
If you already use React Query in your application,
you **should** re-use the `QueryClient` and `QueryClientProvider` you already have.
:::

::: code-group

```typescript twoslash [src/App.tsx]
// @filename: src/server.ts
// @include: react-setup-basic-example

// @filename: src/lib/eden.ts
// ---cut---
// @include: react-setup-client

// @filename: src/App.tsx
// ---cut---
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@ap0nia/eden-react-query'
import React, { useState } from 'react'
import { eden } from './lib/eden'

function getAuthCookie() {
  return null
}

export function App() {
  const [queryClient] = useState(() => new QueryClient())

  const [edenClient] = useState(() =>
    eden.createClient({
      links: [
        httpBatchLink({
          domain: 'http://localhost:3000/eden',

          // You can pass any HTTP headers you wish here
          async headers() {
            return {
              authorization: getAuthCookie(),
            }
          },
        }),
      ],
    }),
  )

  return (
    <eden.Provider client={edenClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{/* Your app here */}</QueryClientProvider>
    </eden.Provider>
  )
}
```

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// @include: react-setup-basic-example

// @filename: src/lib/eden.ts
// ---cut---
// @include: react-setup-client
```

```typescript twoslash [src/server.ts]
// @include: react-setup-basic-example
```

:::

:::note
The reason for using `useState` in the creation of the `queryClient` and the `TRPCClient`,
as opposed to declaring them outside of the component, is to ensure that each request gets a unique client when using SSR.
If you use client side rendering then you can move them if you wish.
:::

#### 5. Fetch data

You can now use the eden-treaty React Query integration to call queries and mutations on your API.

::: code-group

```typescript twoslash [src/pages/IndexPage.tsx]
// @filename: src/server.ts
// @include: react-setup-basic-example

// @filename: src/lib/eden.ts
// ---cut---
// @include: react-setup-client

// @filename: src/pages/App.tsx
// ---cut---
import { eden } from '../lib/eden'

export default function IndexPage() {
  const userQuery = eden.user.get.useQuery({ query: { id: 'id_bilbo' }})
  const userCreator = eden.user.post.useMutation()

  return (
    <div>
      <p>{userQuery.data?.name}</p>

      <button onClick={() => userCreator.mutate({ name: 'Frodo' })}>Create Frodo</button>
    </div>
  )
}
```

```typescript twoslash [src/App.tsx]
// @filename: src/server.ts
// @include: react-setup-basic-example

// @filename: src/lib/eden.ts
// ---cut---
// @include: react-setup-client

// @filename: src/App.tsx
// ---cut---
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@ap0nia/eden-react-query'
import React, { useState } from 'react'
import { eden } from './lib/eden'

function getAuthCookie() {
  return null
}

export function App() {
  const [queryClient] = useState(() => new QueryClient())

  const [edenClient] = useState(() =>
    eden.createClient({
      links: [
        httpBatchLink({
          domain: 'http://localhost:3000/eden',

          // You can pass any HTTP headers you wish here
          async headers() {
            return {
              authorization: getAuthCookie(),
            }
          },
        }),
      ],
    }),
  )

  return (
    <eden.Provider client={edenClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{/* Your app here */}</QueryClientProvider>
    </eden.Provider>
  )
}
```

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// @include: react-setup-basic-example

// @filename: src/lib/eden.ts
// ---cut---
// @include: react-setup-client
```

```typescript twoslash [src/server.ts]
// @include: react-setup-basic-example
```

:::
